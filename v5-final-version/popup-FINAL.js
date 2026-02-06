// FINAL VERSION 5.1.0 - Enhanced messenger response handling
console.log('🤖 @fred Bot Popup: FINAL VERSION 5.1.0 - Enhanced messenger response!');

let debugLog = ['=== FINAL VERSION 5.1.0 DEBUG LOG ==='];
let settings = {
  gatewayUrl: '',
  sessionKey: ''
};

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

// Load settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  log('Loading settings...');
  if (data.gatewayUrl) {
    document.getElementById('gatewayUrl').value = data.gatewayUrl;
    settings.gatewayUrl = data.gatewayUrl;
    log('Gateway URL loaded: ' + data.gatewayUrl, 'success');
  }
  if (data.sessionKey) {
    document.getElementById('sessionKey').value = data.sessionKey;
    settings.sessionKey = data.sessionKey;
    log('Session key loaded', 'success');
  }
  if (!data.gatewayUrl && !data.sessionKey) {
    showStatus('🔧 Welcome to FINAL VERSION 5.1.0! Enter your settings.', 'info');
  } else {
    showStatus('✅ Settings loaded - Final Version 5.1.0 ready!', 'success');
  }
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', function() {
  log('Save settings clicked', 'info');
  
  const gatewayUrl = document.getElementById('gatewayUrl').value.trim();
  const sessionKey = document.getElementById('sessionKey').value.trim();
  
  if (!gatewayUrl || !sessionKey) {
    showStatus('❌ Please fill in ALL fields', 'error');
    return;
  }
  
  const cleanUrl = gatewayUrl.endsWith('/') ? gatewayUrl : gatewayUrl + '/';
  
  settings = {
    gatewayUrl: cleanUrl,
    sessionKey: sessionKey
  };
  
  chrome.storage.sync.set(settings, function() {
    showStatus('✅ Settings saved - Final Version 5.1.0 ready!', 'success');
    log('Settings saved successfully', 'success');
  });
});

// Test connection
document.getElementById('testConnection').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('❌ Please save settings first', 'error');
    return;
  }
  
  log('Testing connection...', 'info');
  showStatus('🧪 Testing connection to Moltbot...', 'info');
  
  const testUrl = settings.gatewayUrl + 'api/v1/sessions/send';
  
  fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionKey: settings.sessionKey,
      message: "Connection test from @fred Bot extension FINAL VERSION 5.1.0",
      timeoutSeconds: 10
    })
  }).then(response => response.json())
  .then(data => {
    log('Connection test successful!', 'success');
    showStatus('✅ Connection successful! Ready to inject.', 'success');
  })
  .catch(error => {
    log('Connection test failed: ' + error.message, 'error');
    showStatus('❌ Connection failed: ' + error.message, 'error');
  });
});

// Inject bot
document.getElementById('injectBot').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('❌ Please save settings first', 'error');
    return;
  }
  
  log('Injecting bot...', 'info');
  showStatus('🚀 Injecting bot into current tab...', 'info');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      showStatus('❌ No active tab found', 'error');
      return;
    }
    
    const tab = tabs[0];
    log('Injecting into tab: ' + tab.url, 'info');
    
    if (!tab.url.includes('facebook.com') && !tab.url.includes('messenger.com')) {
      showStatus('❌ This only works on Facebook/Messenger pages', 'error');
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (gatewayUrl, sessionKey) => {
        console.log('🤖 @fred Bot: FINAL VERSION 5.1.0 INJECTION');
        
        // Remove existing button
        const existingButton = document.getElementById('fred-floating-button');
        if (existingButton) {
          existingButton.remove();
        }
        
        // Create floating button
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
        `;
        
        let isEnabled = false;
        
        button.addEventListener('click', function() {
          isEnabled = !isEnabled;
          
          if (isEnabled) {
            button.innerHTML = '🤖 Disable @fred Bot';
            button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
            alert('✅ @fred Bot FINAL VERSION 5.1.0 is now ENABLED!\n\nType @fred in any chat to test.');
          } else {
            button.innerHTML = '🤖 Enable @fred Bot';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            alert('@fred Bot is now DISABLED');
          }
          
          localStorage.setItem('fred-bot-enabled-v5', isEnabled);
        });
        
        document.body.appendChild(button);
        
        // Message detection
        setInterval(() => {
          if (!isEnabled) return;
          
          const messages = document.querySelectorAll('[data-testid="message_text"], .ni8dbmo4.stjgntxs, [class*="message"]');
          
          messages.forEach(message => {
            if (message.hasAttribute('data-fred-checked-v5')) return;
            
            const text = (message.textContent || message.innerText || '').toLowerCase();
            if (text.includes('@fred') && text.length > 5) {
              message.setAttribute('data-fred-checked-v5', 'true');
              console.log('Found @fred mention:', text);
              
              // Send to Moltbot with enhanced format
              fetch(gatewayUrl + 'api/v1/sessions/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionKey: sessionKey,
                  message: `[FB_MESSENGER] [CHAT_ID:${window.location.pathname}] [@fred mention] ${text}`,
                  context: {
                    source: "messenger_extension",
                    platform: "facebook_messenger",
                    chat_id: window.location.pathname,
                    sender: "facebook_user",
                    timestamp: new Date().toISOString(),
                    can_respond_independently: true,
                    is_autonomous: true
                  },
                  timeoutSeconds: 30
                })
              }).then(response => response.json())
              .then(data => {
                const reply = data.response || 'Got your message!';
                alert(`🤖 @fred Bot Response:\n\n${reply}`);
              })
              .catch(error => {
                console.error('Error:', error);
                alert('❌ Error getting response');
              });
            }
          });
        }, 1000);
        
        return {
          success: true,
          message: '@fred Bot FINAL V5.1.0 injected successfully!'
        };
      },
      args: [settings.gatewayUrl, settings.sessionKey]
    }).then(result => {
      showStatus('✅ Bot injected successfully!', 'success');
      alert('🎉 SUCCESS!\n\n@fred Bot FINAL V5.1.0 has been injected!\n\nClick the purple button to enable.');
    }).catch(error => {
      showStatus('❌ Injection failed: ' + error.message, 'error');
    });
  });
});

// Check status
document.getElementById('checkStatus').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) return;
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const button = document.getElementById('fred-floating-button');
        return {
          hasButton: !!button,
          buttonText: button ? button.innerHTML : null
        };
      }
    }).then(result => {
      const data = result[0].result;
      if (data.hasButton) {
        showStatus('✅ Bot is active! Button: ' + data.buttonText, 'success');
      } else {
        showStatus('ℹ️ Bot not found - click "Inject Bot"', 'info');
      }
    });
  });
});

log('🚀 FINAL VERSION 5.1.0 fully loaded!', 'success');