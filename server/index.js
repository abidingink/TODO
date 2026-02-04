#!/usr/bin/env node

import express from 'express';
import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

// In-memory storage for messages and config
let messages = [];
let config = {
  enabled: true,
  triggerWord: 'fred',
  caseSensitive: false,
  responsePrefix: '🤖 Fred: '
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Configuration endpoints
app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  res.json(config);
});

// Messages endpoints
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { message, sender, timestamp } = req.body;
  messages.push({ id: Date.now(), message, sender, timestamp, isFred: false });
  res.json({ success: true });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const fredMessages = messages.filter(m => m.isFred).length;
  res.json({
    totalMessages: messages.length,
    fredMessages: fredMessages,
    active: config.enabled
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fred Messenger backend running on port ${PORT}`);
  
  // Initialize browser automation if credentials are provided
  if (process.env.FACEBOOK_EMAIL && process.env.FACEBOOK_PASSWORD) {
    console.log('Starting Facebook Messenger monitoring...');
    startFacebookMonitoring();
  } else {
    console.log('No Facebook credentials provided. Running in dashboard-only mode.');
  }
});

async function startFacebookMonitoring() {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Login to Facebook
    await page.goto('https://www.facebook.com/login');
    await page.fill('#email', process.env.FACEBOOK_EMAIL);
    await page.fill('#pass', process.env.FACEBOOK_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForNavigation({ timeout: 30000 });
    
    console.log('Successfully logged into Facebook');
    
    // Navigate to Messenger
    await page.goto('https://www.messenger.com/');
    await page.waitForLoadState('networkidle');
    
    console.log('Monitoring Messenger chats for "@Fred" mentions...');
    
    // Monitor for messages (this is a simplified version)
    // In a real implementation, you'd use more sophisticated selectors
    setInterval(async () => {
      try {
        // This is a placeholder - actual implementation would be more complex
        const messageElements = await page.$$('div[role="row"] div[role="gridcell"]');
        
        for (const element of messageElements) {
          const text = await element.textContent();
          if (text && text.toLowerCase().includes('@fred')) {
            console.log('Detected @Fred mention:', text);
            
            // Send to Moltbot for AI response
            if (process.env.MOLTBOT_WEBHOOK_URL) {
              try {
                const response = await fetch(process.env.MOLTBOT_WEBHOOK_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: text,
                    context: 'facebook_messenger'
                  })
                });
                
                const aiResponse = await response.text();
                console.log('AI Response:', aiResponse);
                
                // Store the interaction
                messages.push({
                  id: Date.now(),
                  message: text,
                  sender: 'user',
                  timestamp: new Date().toISOString(),
                  isFred: false
                });
                
                messages.push({
                  id: Date.now() + 1,
                  message: aiResponse,
                  sender: 'Fred',
                  timestamp: new Date().toISOString(),
                  isFred: true
                });
              } catch (error) {
                console.error('Error calling Moltbot:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring messages:', error);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error starting Facebook monitoring:', error);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});