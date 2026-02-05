// Enhanced content script with better Facebook Messenger support

let settings = {};
let enabledChats = new Set();
let isProcessing = false;

// Load settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  settings = data;
  console.log('@fred Bot: Settings loaded:', settings);
});

// Listen for settings updates
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsUpdated') {
    settings = {
      gatewayUrl: request.gatewayUrl,
      sessionKey: request.sessionKey
    };
    console.log('@fred Bot: Settings updated');
  }
});

// Monitor for new messages
function monitorMessages() {
  console.log('@fred Bot: Starting message monitoring');
  
  // Check for new messages periodically
  setInterval(function() {
    if (settings.gatewayUrl && settings.sessionKey && !isProcessing) {
      checkForMentions();
    }
  }, 2000);
}

// Check for @fred mentions
function checkForMentions() {
  // Get current chat ID
  const chatId = getCurrentChatId();
  if (!chatId || !enabledChats.has(chatId)) {
    return;
  }
  
  // Find recent messages - updated selectors for Facebook Messenger
  const messageSelectors = [
    '[data-testid="message_text"]',
    '.ni8dbmo4.stjgntxs',
    '[class*="message"]',
    '[data-pagelet="ChatTab"] [class*="message"]',
    '[role="main"] [class*="message"]'
  ];
  
  let messages = [];
  for (let selector of messageSelectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      messages = Array.from(found);
      break;
    }
  }
  
  for (let message of messages) {
    if (message.hasAttribute('data-fred-processed')) {
      continue;
    }
    
    const text = message.textContent || message.innerText;
    if (text && text.includes('@fred') && text.length > 5) {
      console.log('@fred Bot: Found mention:', text);
      message.setAttribute('data-fred-processed', 'true');
      processMessage(text, message);
      break; // Process one message at a time
    }
  }
}

// Get current chat identifier
function getCurrentChatId() {
  // Try different methods to identify the chat
  const urlMatch = window.location.pathname.match(/\/t\/\d+/);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  // Look for chat title/name
  const titleSelectors = [
    '[data-testid="conversation_header"] h1',
    '[data-testid="conversation_header"] span',
    '[role="banner"] h1',
    '[role="banner"] span',
    '[class*="ThreadHeader"] h1',
    '[class*="ThreadHeader"] span',
    '[aria-label*="Conversation with"]'
  ];
  
  for (let selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim();
    }
  }
  
  return null;
}

// Process the message and get response
async function processMessage(messageText, messageElement) {
  if (isProcessing) return;
  isProcessing = true;
  
  console.log('@fred Bot: Processing message:', messageText);
  
  try {
    // Extract context
    const context = getMessageContext(messageElement);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Add human-like delay
    await delay(3000 + Math.random() * 5000);
    
    // Send to Moltbot
    const response = await sendToMoltbot(messageText, context);
    
    if (response) {
      console.log('@fred Bot: Got response:', response);
      await insertResponse(response);
    }
  } catch (error) {
    console.error('@fred Bot: Error processing message:', error);
  } finally {
    hideTypingIndicator();
    isProcessing = false;
  }
}

// Send message to Moltbot
async function sendToMoltbot(message, context) {
  const url = settings.gatewayUrl + 'api/v1/sessions/send';
  
  try {
    console.log('@fred Bot: Sending to Moltbot:', { url, sessionKey: settings.sessionKey });
    
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
    console.error('@fred Bot: Error contacting Moltbot:', error);
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
    'textarea',
    '[data-pagelet="ChatTab"] textarea',
    '[data-pagelet="ChatTab"] [contenteditable="true"]'
  ];
  
  let input = null;
  for (let selector of inputSelectors) {
    input = document.querySelector(selector);
    if (input) break;
  }
  
  if (!input) {
    console.error('@fred Bot: Could not find message input');
    return;
  }
  
  console.log('@fred Bot: Found input element');
  
  // Focus input
  input.focus();
  
  // Type the message character by character
  for (let char of text) {
    if (input.textContent !== undefined) {
      input.textContent += char;
    }
    if (input.innerText !== undefined) {
      input.innerText += char;
    }
    if (input.value !== undefined) {
      input.value += char;
    }
    
    // Trigger input events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Small delay between characters
    await delay(50 + Math.random() * 100);
  }
  
  // Wait before sending
  await delay(1000);
  
  // Find and click send button
  const sendSelectors = [
    '[data-testid="send_button"]',
    '[aria-label*="send" i]',
    'button[type="submit"]',
    '[data-pagelet="ChatTab"] button[type="submit"]',
    '[data-pagelet="ChatTab"] [aria-label*="send"]'
  ];
  
  for (let selector of sendSelectors) {
    const sendButton = document.querySelector(selector);
    if (sendButton && !sendButton.disabled) {
      console.log('@fred Bot: Clicking send button');
      sendButton.click();
      break;
    }
  }
}

// Show typing indicator
function showTypingIndicator() {
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

// Add enable/disable button to chat - UPDATED for better Facebook compatibility
function addToggleButton() {
  // Check if button already exists
  if (document.getElementById('fred-toggle-button')) {
    return;
  }
  
  console.log('@fred Bot: Looking for chat header...');
  
  // More comprehensive selectors for Facebook Messenger
  const headerSelectors = [
    '[data-testid="conversation_header"]',
    '[role="banner"]',
    '[class*="ThreadHeader"]',
    '[class*="MessagingHeader"]',
    '[data-pagelet="ChatTab"] header',
    '[aria-label*="Conversation with"]',
    'header[role="banner"]',
    // Facebook.com specific
    '[data-pagelet="page"] [role="main"] header',
    '[data-pagelet="page"] [role="banner"]'
  ];
  
  let header = null;
  for (let selector of headerSelectors) {
    header = document.querySelector(selector);
    if (header) {
      console.log('@fred Bot: Found header with selector:', selector);
      break;
    }
  }
  
  // If no header found, try to find any prominent area in the chat
  if (!header) {
    console.log('@fred Bot: No header found, looking for alternative locations...');
    
    // Try to find the conversation area and add button before messages
    const conversationArea = document.querySelector('[data-testid="conversation_area"], [data-pagelet="ChatTab"], [role="main"]');
    if (conversationArea) {
      console.log('@fred Bot: Found conversation area');
      header = conversationArea;
    }
  }
  
  if (!header) {
    console.log('@fred Bot: Could not find suitable location for button');
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
    margin: 10px;
    z-index: 9999;
    position: relative;
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
      console.log('@fred Bot: Disabled for chat:', chatId);
    } else {
      enabledChats.add(chatId);
      button.textContent = 'Disable @fred';
      button.style.background = '#f02849';
      console.log('@fred Bot: Enabled for chat:', chatId);
    }
    
    // Save enabled chats
    chrome.storage.local.set({
      enabledChats: Array.from(enabledChats)
    });
  });
  
  // Try to insert at the beginning of the header
  if (header.firstChild) {
    header.insertBefore(button, header.firstChild);
  } else {
    header.appendChild(button);
  }
  
  console.log('@fred Bot: Button added successfully');
}

// Load enabled chats
chrome.storage.local.get(['enabledChats'], function(data) {
  if (data.enabledChats) {
    enabledChats = new Set(data.enabledChats);
    console.log('@fred Bot: Loaded enabled chats:', Array.from(enabledChats));
  }
});

// Monitor page changes and add toggle button
setInterval(function() {
  addToggleButton();
}, 2000); // Check every 2 seconds

// Start monitoring
console.log('@fred Bot: Extension loaded and starting...');
monitorMessages();