// Content script - runs on Facebook Messenger pages

let settings = {};
let enabledChats = new Set();
let isProcessing = false;

// Load settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  settings = data;
});

// Listen for settings updates
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsUpdated') {
    settings = {
      gatewayUrl: request.gatewayUrl,
      sessionKey: request.sessionKey
    };
  }
});

// Monitor for new messages
function monitorMessages() {
  // Look for message containers
  const messageSelectors = [
    '[data-testid="message_text"]',
    '.ni8dbmo4.stjgntxs',
    '[class*="message"]'
  ];
  
  // Check for new messages periodically
  setInterval(function() {
    checkForMentions();
  }, 2000);
}

// Check for @fred mentions
function checkForMentions() {
  if (!settings.gatewayUrl || !settings.sessionKey || isProcessing) {
    return;
  }
  
  // Get current chat ID
  const chatId = getCurrentChatId();
  if (!chatId || !enabledChats.has(chatId)) {
    return;
  }
  
  // Find recent messages
  const messages = document.querySelectorAll('[data-testid="message_text"], .ni8dbmo4.stjgntxs, [class*="message"]');
  
  for (let message of messages) {
    if (message.hasAttribute('data-fred-processed')) {
      continue;
    }
    
    const text = message.textContent || message.innerText;
    if (text && text.includes('@fred') && text.length > 5) {
      message.setAttribute('data-fred-processed', 'true');
      processMessage(text, message);
      break; // Process one message at a time
    }
  }
}

// Get current chat identifier
function getCurrentChatId() {
  // Try different selectors for chat ID
  const urlMatch = window.location.pathname.match(/\/t\/\d+/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  // Look for chat header
  const header = document.querySelector('[data-testid="conversation_header"], [role="banner"]');
  if (header) {
    return header.textContent || 'unknown';
  }
  
  return null;
}

// Process the message and get response
async function processMessage(messageText, messageElement) {
  if (isProcessing) return;
  isProcessing = true;
  
  try {
    // Extract context - get last few messages
    const context = getMessageContext(messageElement);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Add human-like delay (3-8 seconds)
    await delay(3000 + Math.random() * 5000);
    
    // Send to Moltbot
    const response = await sendToMoltbot(messageText, context);
    
    if (response) {
      // Insert response
      await insertResponse(response);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  } finally {
    hideTypingIndicator();
    isProcessing = false;
  }
}

// Get message context (last few messages)
function getMessageContext(currentMessage) {
  const messages = Array.from(document.querySelectorAll('[data-testid="message_text"], .ni8dbmo4.stjgntxs'));
  const currentIndex = messages.indexOf(currentMessage);
  
  let context = '';
  // Get last 3-5 messages for context
  const startIndex = Math.max(0, currentIndex - 5);
  for (let i = startIndex; i < currentIndex; i++) {
    const msg = messages[i];
    const sender = msg.closest('[class*="own"], [data-testid="own_message"]') ? 'You' : 'Friend';
    context += `${sender}: ${msg.textContent}\n`;
  }
  
  return context;
}

// Send message to Moltbot
async function sendToMoltbot(message, context) {
  const url = settings.gatewayUrl + 'api/v1/sessions/send';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionKey: settings.sessionKey,
        message: `Facebook Messenger message from friend:\n\n${message}\n\nContext of recent messages:\n${context}`,
        timeoutSeconds: 30
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get response from Moltbot');
    }
    
    const data = await response.json();
    return data.response || data.message;
  } catch (error) {
    console.error('Error contacting Moltbot:', error);
    return null;
  }
}

// Insert response into Messenger
async function insertResponse(text) {
  // Find message input
  const inputSelectors = [
    '[data-testid="composer_input"]',
    'div[contenteditable="true"]',
    '[role="textbox"]',
    'textarea'
  ];
  
  let input = null;
  for (let selector of inputSelectors) {
    input = document.querySelector(selector);
    if (input) break;
  }
  
  if (!input) {
    console.error('Could not find message input');
    return;
  }
  
  // Focus input
  input.focus();
  
  // Type the message character by character (more human-like)
  for (let char of text) {
    input.textContent += char;
    input.innerText += char;
    
    // Trigger input events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Small delay between characters
    await delay(50 + Math.random() * 100);
  }
  
  // Wait a bit before sending
  await delay(1000);
  
  // Find and click send button
  const sendSelectors = [
    '[data-testid="send_button"]',
    '[aria-label*="send" i]',
    'button[type="submit"]'
  ];
  
  for (let selector of sendSelectors) {
    const sendButton = document.querySelector(selector);
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      break;
    }
  }
}

// Show typing indicator
function showTypingIndicator() {
  // Try to find and show Facebook's typing indicator
  const typingIndicator = document.querySelector('[data-testid="typing_indicator"], [class*="typing"]');
  if (typingIndicator) {
    typingIndicator.style.display = 'block';
  }
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.querySelector('[data-testid="typing_indicator"], [class*="typing"]');
  if (typingIndicator) {
    typingIndicator.style.display = 'none';
  }
}

// Utility function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add enable/disable button to chat
function addToggleButton() {
  // Check if button already exists
  if (document.getElementById('fred-toggle-button')) {
    return;
  }
  
  // Find chat header or action area
  const headerSelectors = [
    '[data-testid="conversation_header"]',
    '[role="banner"]',
    '[class*="chat_header"]'
  ];
  
  let header = null;
  for (let selector of headerSelectors) {
    header = document.querySelector(selector);
    if (header) break;
  }
  
  if (!header) {
    return;
  }
  
  // Create toggle button
  const button = document.createElement('button');
  button.id = 'fred-toggle-button';
  button.textContent = 'Enable @fred';
  button.style.cssText = `
    background: #1877f2;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
  `;
  
  // Get current chat ID
  const chatId = getCurrentChatId();
  if (chatId && enabledChats.has(chatId)) {
    button.textContent = 'Disable @fred';
    button.style.background = '#f02849';
  }
  
  button.addEventListener('click', function() {
    const chatId = getCurrentChatId();
    if (!chatId) return;
    
    if (enabledChats.has(chatId)) {
      enabledChats.delete(chatId);
      button.textContent = 'Enable @fred';
      button.style.background = '#1877f2';
    } else {
      enabledChats.add(chatId);
      button.textContent = 'Disable @fred';
      button.style.background = '#f02849';
    }
    
    // Save enabled chats
    chrome.storage.local.set({
      enabledChats: Array.from(enabledChats)
    });
  });
  
  header.appendChild(button);
}

// Load enabled chats
chrome.storage.local.get(['enabledChats'], function(data) {
  if (data.enabledChats) {
    enabledChats = new Set(data.enabledChats);
  }
});

// Monitor page changes and add toggle button
setInterval(function() {
  addToggleButton();
}, 1000);

// Start monitoring
monitorMessages();