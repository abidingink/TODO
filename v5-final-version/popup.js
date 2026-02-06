// NEW VERSION 5.1.0 - Completely rewritten with extensive debugging
console.log('🤖 @fred Bot Popup: VERSION 5.1.0 LOADED - This is the NEW version!');

let debugLog = ['=== NEW VERSION 5.1.0 DEBUG LOG ==='];
let settings = {
  gatewayUrl: '',
  sessionKey: ''
};

// Enhanced logging
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  console.log(logMessage);
  debugLog.push(logMessage);
  updateDebugDisplay();
}

function updateDebugDisplay() {
  const debugDiv = document.getElementById('debug');
  if (debugLog.length > 1) {
    debugDiv.innerHTML = debugLog.join('<br>');
    debugDiv.style.display = 'block';
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  log(message, type);
}

function updateStep(stepNumber, status) {
  const step = document.getElementById('step' + stepNumber);
  if (status === 'active') {
    step.className = 'step active';
  } else if (status === 'completed') {
    step.className = 'step completed';
  } else {
    step.className = 'step';
  }
}

// Load settings on startup
log('Loading settings...');
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  log('Chrome storage retrieved', 'info');
  log('Data received: ' + JSON.stringify(data), 'debug');
  
  if (data.gatewayUrl) {
    document.getElementById('gatewayUrl').value = data.gatewayUrl;
    settings.gatewayUrl = data.gatewayUrl;
    log('Gateway URL loaded: ' + data.gatewayUrl, 'success');
    updateStep(1, 'completed');
  }
  if (data.sessionKey) {
    document.getElementById('sessionKey').value = data.sessionKey;
    settings.sessionKey = data.sessionKey;
    log('Session key loaded', 'success');
    updateStep(1, 'completed');
  }
  
  if (!data.gatewayUrl && !data.sessionKey) {
    log('No settings found - fresh install', 'info');
    showStatus('🔧 Welcome to VERSION 5.1.0! Enter your settings below.', 'info');
  } else {
    log('Settings loaded successfully', 'success');
    showStatus('✅ Settings loaded - Ready for Version 5.1.0!', 'success');
  }
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', function() {
  log('Save settings button clicked', 'info');
  updateStep(1, 'active');
  
  const gatewayUrl = document.getElementById('gatewayUrl').value.trim();
  const sessionKey = document.getElementById('sessionKey').value.trim();
  
  log('Gateway URL input: ' + gatewayUrl, 'debug');
  log('Session key input: ' + (sessionKey ? '***hidden***' : 'empty'), 'debug');
  
  if (!gatewayUrl || !sessionKey) {
    log('Save failed - missing fields', 'error');
    showStatus('❌ Please fill in ALL fields', 'error');
    updateStep(1, 'error');
    return;
  }
  
  // Ensure URL ends with /
  const cleanUrl = gatewayUrl.endsWith('/') ? gatewayUrl : gatewayUrl + '/';
  log('Cleaned URL: ' + cleanUrl, 'debug');
  
  settings = {
    gatewayUrl: cleanUrl,
    sessionKey: sessionKey
  };
  
  log('Saving to Chrome storage...', 'info');
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      log('Save error: ' + chrome.runtime.lastError.message, 'error');
      showStatus('❌ Save failed: ' + chrome.runtime.lastError.message, 'error');
      updateStep(1, 'error');
    } else {
      log('Settings saved successfully!', 'success');
      showStatus('✅ Settings saved - Version 5.1.0 is ready!', 'success');
      updateStep(1, 'completed');
      updateStep(2, 'active');
    }
  });
});

// Test connection
document.getElementById('testConnection').addEventListener('click', function() {
  log('Test connection button clicked', 'info');
  updateStep(2, 'active');
  
  if (!settings.gatewayUrl || !settings.sessionKey) {
    log('Test failed - no settings', 'error');
    showStatus('❌ Please save settings first', 'error');
    updateStep(2, 'error');
    return;
  }
  
  log('Testing connection to: ' + settings.gatewayUrl, 'info');
  showStatus('🧪 Testing connection to Moltbot...', 'info');
  
  const testUrl = settings.gatewayUrl + 'api/v1/sessions/send';
  log('Test URL: ' + testUrl, 'debug');
  
  fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionKey: settings.sessionKey,
      message: "Connection test from @fred Bot extension VERSION 5.1.0",
      timeoutSeconds: 10
    })
  }).then(response => {
    log('Response received - Status: ' + response.status, 'info');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' - ' + response.statusText);
    }
    return response.json();
  }).then(data => {
    log('Response data: ' + JSON.stringify(data).substring(0, 200), 'debug');
    log('Connection test SUCCESSFUL!', 'success');
    showStatus('✅ Connection successful! Ready to inject.', 'success');
    updateStep(2, 'completed');
    updateStep(3, 'active');
  }).catch(error => {
    log('Connection test FAILED: ' + error.message, 'error');
    log('Full error: ' + error.stack, 'debug');
    showStatus('❌ Connection failed: ' + error.message, 'error');
    updateStep(2, 'error');
  });
});

// Inject bot
document.getElementById('injectBot').addEventListener('click', function() {
  log('Inject bot button clicked', 'info');
  updateStep(3, 'active');
  
  if (!settings.gatewayUrl || !settings.sessionKey) {
    log('Injection failed - no settings', 'error');
    showStatus('❌ Please save settings first', 'error');
    updateStep(3, 'error');
    return;
  }
  
  log('Starting injection process...', 'info');
  showStatus('🚀 Injecting bot into current tab...', 'info');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      log('No active tab found!', 'error');
      showStatus('❌ No active tab found', 'error');
      updateStep(3, 'error');
      return;
    }
    
    const tab = tabs[0];
    log('Active tab found: ' + tab.url, 'info');
    log('Tab ID: ' + tab.id, 'debug');
    
    if (!tab.url.includes('facebook.com') && !tab.url.includes('messenger.com')) {
      log('Wrong domain: ' + tab.url, 'error');
      showStatus('❌ This only works on Facebook/Messenger pages', 'error');
      updateStep(3, 'error');
      return;
    }
    
    log('Domain check passed', 'success');
    log('Preparing injection code...', 'info');
    
    // Inject the bot functionality
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (gatewayUrl, sessionKey) => {
        console.log('🤖 @fred Bot: INJECTION STARTED - VERSION 5.1.0');
        console.log('Settings:', { gatewayUrl, sessionKey: '***hidden***' });
        
        // Remove existing button if any
        const existingButton = document.getElementById('fred-floating-button');
        if (existingButton) {
          console.log('Removing existing button');
          existingButton.remove();
        }
        
        // Create floating button with NEW design
        const button = document.createElement('div');
        button.id = 'fred-floating-button';
        button.innerHTML = '🤖 Enable @fred Bot';
        button.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 25px;
          border-radius: 25px;
          cursor: pointer;
          font-family: Arial, sans-serif;
          font-size: 16px;
          font-weight: bold;
          z-index: 999999;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          border: 3px solid white;
          user-select: none;
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        let isEnabled = false;
        
        button.addEventListener('click', function() {
          console.log('Button clicked, current state:', isEnabled);
          isEnabled = !isEnabled;
          
          if (isEnabled) {
            button.innerHTML = '🤖 Disable @fred Bot';
            button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            alert('✅ @fred Bot VERSION 5.1.0 is now ENABLED!\n\nType @fred in any chat to test.');
            console.log('Bot ENABLED');
          } else {
            button.innerHTML = '🤖 Enable @fred Bot';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            alert('@fred Bot is now DISABLED');
            console.log('Bot DISABLED');
          }
          
          localStorage.setItem('fred-bot-enabled-v5', isEnabled);
        });
        
        // Load saved state
        const savedState = localStorage.getItem('fred-bot-enabled-v5');
        if (savedState === 'true') {
          isEnabled = true;
          button.innerHTML = '🤖 Disable @fred Bot';
          button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
          console.log('Loaded saved state: ENABLED');
        }
        
        document.body.appendChild(button);
        console.log('✅ Floating button added successfully!');
        
        // Message detection with NEW logic
        console.log('Starting message detection...');
        let messageCount = 0;
        
        const detectMessages = () => {
          if (!isEnabled) return;
          
          messageCount++;
          if (messageCount % 50 === 0) {
            console.log('Still scanning for messages... (' + messageCount + ' checks)');
          }
          
          // Multiple selectors for better coverage
          const selectors = [
            '[data-testid="message_text"]',
            '.ni8dbmo4.stjgntxs',
            '[class*="message"]',
            '[role="main"] [class*="message"]',
            '[data-pagelet] [class*="message"]',
            '[data-testid="message-container"]'
          ];
          
          let messages = [];
          for (let selector of selectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
              messages = Array.from(found);
              console.log('Found ' + messages.length + ' messages with selector: ' + selector);
              break;
            }
          }
          
          if (messages.length === 0) return;
          
          messages.forEach((message, index) => {
            if (message.hasAttribute('data-fred-checked-v5')) return;
            
            const text = (message.textContent || message.innerText || '').toLowerCase();
            if (text.includes('@fred') && text.length > 5) {
              message.setAttribute('data-fred-checked-v5', 'true');
              console.log('🎯 FOUND @fred mention #' + index + ': ' + text.substring(0, 100));
              
              // Send to Moltbot
              console.log('Sending to Moltbot...');
              fetch(gatewayUrl + 'api/v1/sessions/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionKey: sessionKey,
                  message: `Facebook Messenger - @fred mentioned (V5.1.0):\n${text}`,
                  timeoutSeconds: 30
                })
              }).then(response => {
                console.log('Moltbot response status: ' + response.status);
                return response.json();
              }).then(data => {
                const reply = data.response || 'Got your message!';
                console.log('Moltbot response: ' + reply);
                alert(`🤖 @fred Bot Response (V5.1.0):\n\n${reply}`);
              }).catch(error => {
                console.error('Moltbot error:', error);
                alert('❌ Error getting response from Moltbot: ' + error.message);
              });
            }
          });
        };
        
        // Scan every second
        setInterval(detectMessages, 1000);
        console.log('✅ Message detection started - scanning every second');
        
        return {
          success: true,
          message: '@fred Bot V5.1.0 injected successfully!',
          buttonAdded: true,
          isFacebook: window.location.hostname.includes('facebook.com') || window.location.hostname.includes('messenger.com')
        };
      },
      args: [settings.gatewayUrl, settings.sessionKey]
    }).then(result => {
      const data = result[0].result;
      log('Injection completed successfully!', 'success');
      log('Result: ' + JSON.stringify(data), 'debug');
      showStatus('✅ Bot injected successfully!', 'success');
      updateStep(3, 'completed');
      updateStep(4, 'active');
      
      // Show success message
      alert('🎉 SUCCESS!\n\n@fred Bot V5.1.0 has been injected!\n\nLook for the purple floating button and click it to enable.\n\nThen type @fred in any chat to test!');
    }).catch(error => {
      log('Injection failed: ' + error.message, 'error');
      log('Full error: ' + error.stack, 'debug');
      showStatus('❌ Injection failed: ' + error.message, 'error');
      updateStep(3, 'error');
    });
  });
});

// Check status
document.getElementById('checkStatus').addEventListener('click', function() {
  log('Checking status...', 'info');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      log('No active tab for status check', 'error');
      showStatus('❌ No active tab', 'error');
      return;
    }
    
    log('Checking status for tab: ' + tabs[0].url, 'info');
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const button = document.getElementById('fred-floating-button');
        const isFacebook = window.location.hostname.includes('facebook.com') || window.location.hostname.includes('messenger.com');
        
        return {
          hasButton: !!button,
          buttonText: button ? button.innerHTML : null,
          currentUrl: window.location.href,
          isFacebook: isFacebook,
          hostname: window.location.hostname
        };
      }
    }).then(result => {
      const data = result[0].result;
      log('Status check result: ' + JSON.stringify(data), 'debug');
      
      if (data.hasButton) {
        log('Bot is active on this page!', 'success');
        showStatus('✅ Bot is active! Button found: ' + data.buttonText, 'success');
      } else {
        log('Bot not found on this page', 'info');
        showStatus('ℹ️ Bot not found - click "Inject Bot" to add it', 'info');
      }
    }).catch(error => {
      log('Status check failed: ' + error.message, 'error');
      showStatus('❌ Status check failed: ' + error.message, 'error');
    });
  });
});

// Log startup
log('🚀 @fred Bot Popup V5.1.0 fully loaded and ready!', 'success');
log('This is the NEW version - completely rebuilt!', 'info');