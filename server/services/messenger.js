import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');
const COOKIES_FILE = path.join(DATA_DIR, 'cookies.json');

export class MessengerService extends EventEmitter {
  constructor() {
    super();
    this.browser = null;
    this.page = null;
    this.status = {
      connected: false,
      loggedIn: false,
      loading: false,
      error: null,
      userName: null,
      loginStep: null // 'idle' | 'credentials' | '2fa' | 'complete'
    };
    this.conversations = [];
    this.messages = new Map(); // threadId -> messages[]
    this.autoReplyEnabled = false;
    this.pollingInterval = null;
    this.fredPrefix = '🤖 '; // Prefix for Fred's responses
  }

  getStatus() {
    return { ...this.status };
  }

  getConversations() {
    return [...this.conversations];
  }

  getMessages(threadId) {
    return this.messages.get(threadId) || [];
  }

  setAutoReply(enabled) {
    this.autoReplyEnabled = enabled;
    console.log(`Auto-reply ${enabled ? 'enabled' : 'disabled'}`);
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory exists
    }
  }

  async saveCookies() {
    if (!this.page) return;
    try {
      const cookies = await this.page.cookies();
      await this.ensureDataDir();
      await fs.writeFile(COOKIES_FILE, JSON.stringify(cookies, null, 2));
      console.log('Cookies saved');
    } catch (error) {
      console.error('Failed to save cookies:', error);
    }
  }

  async loadCookies() {
    try {
      const data = await fs.readFile(COOKIES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async initBrowser() {
    if (this.browser) return;

    this.updateStatus({ loading: true, error: null });

    try {
      this.browser = await puppeteer.launch({
        headless: true, // Use headless for server deployment
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to look like a real browser
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Add request interception for performance
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const resourceType = request.resourceType();
        // Block unnecessary resources for faster loading
        if (['image', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      this.updateStatus({ connected: true, loading: false });
      console.log('Browser initialized');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      this.updateStatus({ loading: false, error: error.message });
      throw error;
    }
  }

  async startLogin() {
    await this.initBrowser();

    // Try to restore session first
    const cookies = await this.loadCookies();
    if (cookies && cookies.length > 0) {
      try {
        await this.page.setCookie(...cookies);
        await this.page.goto('https://www.messenger.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check if we're logged in
        const isLoggedIn = await this.checkLoginStatus();
        if (isLoggedIn) {
          this.updateStatus({ loggedIn: true, loginStep: 'complete' });
          this.startPolling();
          return { success: true, step: 'complete' };
        }
      } catch (error) {
        console.log('Session restore failed, proceeding with fresh login');
      }
    }

    // Navigate to messenger login
    await this.page.goto('https://www.messenger.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    this.updateStatus({ loginStep: 'credentials' });
    
    // Take screenshot for UI
    const screenshot = await this.takeScreenshot();
    this.emit('screenshot', { step: 'credentials', screenshot });
    
    return { success: true, step: 'credentials', screenshot };
  }

  async submitCredentials(email, password) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      this.updateStatus({ loading: true });

      // Wait for and fill email
      await this.page.waitForSelector('input[name="email"], input[type="email"], #email', { timeout: 10000 });
      const emailInput = await this.page.$('input[name="email"], input[type="email"], #email');
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(email, { delay: 50 });

      // Wait for and fill password
      await this.page.waitForSelector('input[name="pass"], input[type="password"], #pass', { timeout: 10000 });
      const passInput = await this.page.$('input[name="pass"], input[type="password"], #pass');
      await passInput.click({ clickCount: 3 });
      await passInput.type(password, { delay: 50 });

      // Click login button
      const loginButton = await this.page.$('button[name="login"], button[type="submit"], #loginbutton, [data-testid="royal_login_button"]');
      if (loginButton) {
        await loginButton.click();
      } else {
        await this.page.keyboard.press('Enter');
      }

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await this.delay(3000);

      // Check for 2FA
      const needs2FA = await this.check2FARequired();
      if (needs2FA) {
        this.updateStatus({ loading: false, loginStep: '2fa' });
        const screenshot = await this.takeScreenshot();
        this.emit('screenshot', { step: '2fa', screenshot });
        return { success: true, step: '2fa', screenshot };
      }

      // Check for errors
      const hasError = await this.checkLoginError();
      if (hasError) {
        this.updateStatus({ loading: false, error: 'Login failed. Check your credentials.' });
        const screenshot = await this.takeScreenshot();
        return { success: false, error: 'Login failed', screenshot };
      }

      // Check if logged in
      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        await this.saveCookies();
        await this.extractUserInfo();
        this.updateStatus({ loading: false, loggedIn: true, loginStep: 'complete' });
        this.startPolling();
        return { success: true, step: 'complete' };
      }

      const screenshot = await this.takeScreenshot();
      this.updateStatus({ loading: false });
      return { success: false, error: 'Unknown login state', screenshot };
    } catch (error) {
      console.error('Login error:', error);
      this.updateStatus({ loading: false, error: error.message });
      throw error;
    }
  }

  async submit2FA(code) {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      this.updateStatus({ loading: true });

      // Find and fill 2FA input
      const codeInput = await this.page.$('input[name="approvals_code"], input[type="text"][autocomplete="one-time-code"], input[id*="approvals"], input[placeholder*="code"]');
      if (codeInput) {
        await codeInput.click({ clickCount: 3 });
        await codeInput.type(code, { delay: 50 });
      }

      // Submit
      await this.page.keyboard.press('Enter');
      await this.delay(3000);

      // Handle "Remember browser" prompt if present
      const rememberButton = await this.page.$('button[name="save_device"], button[type="submit"]');
      if (rememberButton) {
        await rememberButton.click();
        await this.delay(2000);
      }

      // Check login status
      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        await this.saveCookies();
        await this.extractUserInfo();
        this.updateStatus({ loading: false, loggedIn: true, loginStep: 'complete' });
        this.startPolling();
        return { success: true, step: 'complete' };
      }

      const screenshot = await this.takeScreenshot();
      this.updateStatus({ loading: false });
      return { success: false, error: '2FA verification failed', screenshot };
    } catch (error) {
      console.error('2FA error:', error);
      this.updateStatus({ loading: false, error: error.message });
      throw error;
    }
  }

  async checkLoginStatus() {
    try {
      const url = this.page.url();
      // Check if we're on the main messenger page (not login)
      if (url.includes('messenger.com/t/') || url === 'https://www.messenger.com/') {
        // Look for elements that indicate logged in state
        const loggedInIndicator = await this.page.$('[aria-label="Chats"], [data-testid="mwthreadlist-item"], [role="navigation"]');
        return !!loggedInIndicator;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async check2FARequired() {
    try {
      const twoFAInput = await this.page.$('input[name="approvals_code"], input[autocomplete="one-time-code"], input[placeholder*="code"]');
      const twoFAText = await this.page.evaluate(() => {
        return document.body.innerText.toLowerCase().includes('two-factor') ||
               document.body.innerText.toLowerCase().includes('verification code') ||
               document.body.innerText.toLowerCase().includes('security code');
      });
      return !!twoFAInput || twoFAText;
    } catch (error) {
      return false;
    }
  }

  async checkLoginError() {
    try {
      const errorText = await this.page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .uiHeaderTitle, ._52lq');
        for (const el of errorElements) {
          if (el.innerText.toLowerCase().includes('incorrect') ||
              el.innerText.toLowerCase().includes('wrong') ||
              el.innerText.toLowerCase().includes('error')) {
            return true;
          }
        }
        return false;
      });
      return errorText;
    } catch (error) {
      return false;
    }
  }

  async extractUserInfo() {
    try {
      const userName = await this.page.evaluate(() => {
        // Try to find user name from various places
        const nameEl = document.querySelector('[data-testid="mwthreadlist-header-title"], [aria-label="Profile"] span');
        return nameEl?.innerText || 'User';
      });
      this.updateStatus({ userName });
    } catch (error) {
      console.log('Could not extract user info');
    }
  }

  async takeScreenshot() {
    if (!this.page) return null;
    try {
      const screenshot = await this.page.screenshot({ encoding: 'base64' });
      return `data:image/png;base64,${screenshot}`;
    } catch (error) {
      console.error('Screenshot error:', error);
      return null;
    }
  }

  startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollConversations();
        await this.pollMessages();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Initial poll
    this.pollConversations();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async pollConversations() {
    if (!this.page || !this.status.loggedIn) return;

    try {
      const conversations = await this.page.evaluate(() => {
        const threads = [];
        const threadItems = document.querySelectorAll('[data-testid="mwthreadlist-item"], [role="row"][tabindex]');
        
        threadItems.forEach((item, index) => {
          if (index >= 20) return; // Limit to 20 conversations
          
          const nameEl = item.querySelector('span[dir="auto"]');
          const previewEl = item.querySelectorAll('span[dir="auto"]')[1];
          const timeEl = item.querySelector('span[data-testid]');
          const avatarEl = item.querySelector('img[src*="scontent"]');
          const unreadEl = item.querySelector('[aria-label*="unread"], [data-testid*="unread"]');
          
          const href = item.querySelector('a')?.href || '';
          const threadId = href.match(/\/t\/(\d+)/)?.[1] || `thread-${index}`;
          
          threads.push({
            id: threadId,
            name: nameEl?.innerText || 'Unknown',
            preview: previewEl?.innerText || '',
            time: timeEl?.innerText || '',
            avatar: avatarEl?.src || null,
            unread: !!unreadEl
          });
        });
        
        return threads;
      });

      this.conversations = conversations;
      this.emit('conversations', conversations);
    } catch (error) {
      console.error('Failed to poll conversations:', error);
    }
  }

  async pollMessages() {
    if (!this.page || !this.status.loggedIn) return;

    try {
      const messages = await this.page.evaluate(() => {
        const msgs = [];
        const messageRows = document.querySelectorAll('[data-testid="message-container"], [role="row"]');
        
        messageRows.forEach((row, index) => {
          if (index >= 50) return; // Limit to 50 messages
          
          const textEl = row.querySelector('[dir="auto"]');
          const isSent = row.classList.contains('_3058') || row.querySelector('[class*="outgoing"]');
          const timeEl = row.querySelector('span[data-testid*="timestamp"]');
          
          if (textEl?.innerText) {
            msgs.push({
              id: `msg-${index}`,
              text: textEl.innerText,
              sent: !!isSent,
              time: timeEl?.innerText || ''
            });
          }
        });
        
        return msgs;
      });

      // Get current thread ID from URL
      const url = this.page.url();
      const threadId = url.match(/\/t\/(\d+)/)?.[1];
      
      if (threadId && messages.length > 0) {
        const oldMessages = this.messages.get(threadId) || [];
        this.messages.set(threadId, messages);
        
        // Check for new messages (auto-reply)
        if (this.autoReplyEnabled && messages.length > oldMessages.length) {
          const newMessage = messages[messages.length - 1];
          if (!newMessage.sent) {
            await this.handleAutoReply(threadId, newMessage);
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  }

  async handleAutoReply(threadId, message) {
    // This is where Fred's AI would generate a response
    // For now, we'll use a placeholder
    console.log(`New message in ${threadId}: ${message.text}`);
    
    // Emit event for external AI integration
    this.emit('message', {
      threadId,
      message,
      needsReply: true
    });
  }

  async sendMessage(threadId, text) {
    if (!this.page || !this.status.loggedIn) {
      throw new Error('Not logged in');
    }

    try {
      // Navigate to thread if needed
      const url = this.page.url();
      if (!url.includes(`/t/${threadId}`)) {
        await this.navigateToThread(threadId);
      }

      // Find and fill message input
      const messageInput = await this.page.$('[contenteditable="true"][role="textbox"], [aria-label*="message"], textarea[name="message"]');
      if (!messageInput) {
        throw new Error('Message input not found');
      }

      await messageInput.click();
      await this.page.keyboard.type(text, { delay: 30 });
      
      // Send with Enter
      await this.page.keyboard.press('Enter');
      await this.delay(1000);

      console.log(`Message sent to ${threadId}: ${text}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async navigateToThread(threadId) {
    if (!this.page) return;
    
    try {
      await this.page.goto(`https://www.messenger.com/t/${threadId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async logout() {
    this.stopPolling();
    
    try {
      // Delete cookies
      await fs.unlink(COOKIES_FILE).catch(() => {});
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }

      this.conversations = [];
      this.messages.clear();
      this.updateStatus({
        connected: false,
        loggedIn: false,
        loading: false,
        error: null,
        userName: null,
        loginStep: 'idle'
      });

      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    this.emit('status', this.status);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
