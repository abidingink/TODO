// Ultra-simple version - just adds a floating button and basic detection

let settings = {};
let isEnabled = false;

// Load settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  settings = data;
  console.log('@fred Bot Simple: Settings loaded');
});

// Listen for settings updates
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'settingsUpdated') {
    settings = {
      gatewayUrl: request.gatewayUrl,
      sessionKey: request.sessionKey
    };
    console.log('@fred Bot Simple: Settings updated');
  }
});

// Add floating button immediately
function addFloatingButton() {
  // Check if button already exists
  if (document.getElementById('fred-floating-button')) {
    return;
  }
  
  console.log('@fred Bot Simple: Adding floating button...');
  
  // Create floating button
  const button = document.createElement('div');
  button.id = 'fred-floating-button';
  button.innerHTML = 'Enable @fred';
  button.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #1877f2;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 99999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    user-select: none;
  `;
  
  // Load saved state
  chrome.storage.local.get(['fredEnabled'], function(data) {
    if (data.fredEnabled) {
      isEnabled = true;
      button.innerHTML = 'Disable @fred';
      button.style.background = '#f02849';
    }
  });
  
  button.addEventListener('click', function() {
    isEnabled = !isEnabled;
    
    if (isEnabled) {
      button.innerHTML = 'Disable @fred';
      button.style.background = '#f02849';
      console.log('@fred Bot Simple: ENABLED');
      
      if (!settings.gatewayUrl || !settings.sessionKey) {
        alert('⚠️ Please configure @fred Bot settings first!\n\nClick the extension icon in toolbar to set up.');
        isEnabled = false;
        button.innerHTML = 'Enable @fred';
        button.style.background = '#1877f2';
        return;
      }
      
      alert('✅ @fred Bot is now ENABLED!\n\nType @fred in any chat to test.');
    } else {
      button.innerHTML = 'Enable @fred';
      button.style.background = '#1877f2';
      console.log('@fred Bot Simple: DISABLED');
      alert('@fred Bot is now DISABLED');
    }
    
    // Save state
    chrome.storage.local.set({ fredEnabled: isEnabled });
  });
  
  // Add to page
  document.body.appendChild(button);
  console.log('@fred Bot Simple: Floating button added!');
}

// Simple message detection
function detectMessages() {
  if (!isEnabled) return;
  
  // Look for messages - very broad selectors
  const selectors = [
    '[data-testid="message_text"]',
    '.ni8dbmo4.stjgntxs',
    '[class*="message"]',
    '[role="main"] [class*="message"]',
    '[data-pagelet] [class*="message"]'
  ];
  
  let messages = [];
  for (let selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      messages = Array.from(found);
      break;
    }
  }
  
  messages.forEach(message => {
    if (message.hasAttribute('data-fred-checked')) return;
    
    const text = (message.textContent || message.innerText || '').toLowerCase();
    if (text.includes('@fred')) {
      message.setAttribute('data-fred-checked', 'true');
      console.log('@fred Bot Simple: Found @fred mention:', text);
      
      // Process the message
      processMessage(text);
    }
  });
}

// Process the mention
async function processMessage(messageText) {
  console.log('@fred Bot Simple: Processing message:', messageText);
  
  try {
    // Show typing indicator (simple version)
    const input = document.querySelector('[contenteditable="true"], textarea, [data-testid="composer_input"]');
    if (input) {
      input.focus();
      input.textContent = 'Typing...';
    }
    
    // Send to Moltbot
    const url = settings.gatewayUrl + 'api/v1/sessions/send';
    console.log('@fred Bot Simple: Sending to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionKey: settings.sessionKey,
        message: `Facebook Messenger - someone mentioned @fred:\n\n${messageText}`,
        timeoutSeconds: 30
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get response');
    }
    
    const data = await response.json();
    const reply = data.response || data.message || 'Got your message!';
    
    console.log('@fred Bot Simple: Got reply:', reply);
    
    // Simple response - just replace the typing text
    if (input) {
      input.textContent = reply;
    }
    
    // Wait a bit then clear
    setTimeout(() => {
      if (input) input.textContent = '';
    }, 2000);
    
  } catch (error) {
    console.error('@fred Bot Simple: Error:', error);
    alert('Error getting response from Moltbot. Check console for details.');
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('@fred Bot Simple: Initializing...');
  
  // Wait a bit for Facebook to load
  setTimeout(() => {
    addFloatingButton();
  }, 2000);
  
  // Start message detection
  setInterval(detectMessages, 1000);
  
  console.log('@fred Bot Simple: Started!');
}