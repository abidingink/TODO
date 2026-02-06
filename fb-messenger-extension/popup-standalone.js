// Standalone popup - no communication with content scripts
console.log('@fred Bot Popup: Version 5.1.0 loaded');

let debugLog = [];
let settings = {
  gatewayUrl: '',
  sessionKey: ''
};

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  debugLog.push(logMessage);
  updateDebugDisplay();
}

function updateDebugDisplay() {
  const debugDiv = document.getElementById('debug');
  if (debugLog.length > 0) {
    debugDiv.innerHTML = debugLog.join('<br>');
    debugDiv.style.display = 'block';
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  log(message);
}

// Load settings on startup
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  log('Loading settings...');
  if (data.gatewayUrl) {
    document.getElementById('gatewayUrl').value = data.gatewayUrl;
    settings.gatewayUrl = data.gatewayUrl;
    log('Gateway URL loaded: ' + data.gatewayUrl);
  }
  if (data.sessionKey) {
    document.getElementById('sessionKey').value = data.sessionKey;
    settings.sessionKey = data.sessionKey;
    log('Session key loaded');
  }
  if (!data.gatewayUrl && !data.sessionKey) {
    showStatus('Please enter your Moltbot settings', 'info');
  } else {
    showStatus('Settings loaded - ready to inject!', 'success');
  }
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', function() {
  const gatewayUrl = document.getElementById('gatewayUrl').value.trim();
  const sessionKey = document.getElementById('sessionKey').value.trim();
  
  if (!gatewayUrl || !sessionKey) {
    showStatus('Please fill in all fields', 'error');
    log('Save failed - missing fields');
    return;
  }
  
  // Ensure URL ends with /
  const cleanUrl = gatewayUrl.endsWith('/') ? gatewayUrl : gatewayUrl + '/';
  
  settings = {
    gatewayUrl: cleanUrl,
    sessionKey: sessionKey
  };
  
  chrome.storage.sync.set(settings, function() {
    showStatus('Settings saved successfully!', 'success');
    log('Settings saved: ' + cleanUrl);
  });
});

// Test connection
document.getElementById('testConnection').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('Please save settings first', 'error');
    return;
  }
  
  showStatus('Testing connection...', 'info');
  log('Testing connection to: ' + settings.gatewayUrl);
  
  const testUrl = settings.gatewayUrl + 'api/v1/sessions/send';
  
  fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionKey: settings.sessionKey,
      message: "Connection test from @fred Bot extension",
      timeoutSeconds: 10
    })
  }).then(response => {
    log('Response status: ' + response.status);
    return response.json();
  }).then(data => {
    log('Response received: ' + JSON.stringify(data).substring(0, 100));
    showStatus('✅ Connection successful!', 'success');
  }).catch(error => {
    log('Connection failed: ' + error.message);
    showStatus('❌ Connection failed: ' + error.message, 'error');
  });
});

// Inject bot
document.getElementById('injectBot').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('Please save settings first', 'error');
    return;
  }
  
  showStatus('Injecting bot...', 'info');
  log('Starting injection process');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      showStatus('No active tab found', 'error');
      log('No active tab');
      return;
    }
    
    const tab = tabs[0];
    log('Active tab: ' + tab.url);
    
    if (!tab.url.includes('facebook.com') && !tab.url.includes('messenger.com')) {
      showStatus('This only works on Facebook/Messenger pages', 'error');
      log('Wrong domain: ' + tab.url);
      return;
    }
    
    // Inject the bot functionality
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (gatewayUrl, sessionKey) => {
        console.log('@fred Bot: Injecting with settings:', { gatewayUrl, sessionKey });
        
        // Remove existing button if any
        const existingButton = document.getElementById('fred-floating-button');
        if (existingButton) {
          existingButton.remove();
        }
        
        // Create floating button
        const button = document.createElement('div');
        button.id = 'fred-floating-button';
        button.innerHTML = 'Enable @fred Bot';
        button.style.cssText = `
          position: fixed;
          top: 100px;
          right: 20px;
          background: #1877f2;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-family: Arial, sans-serif;
          font-size: 16px;
          z-index: 999999;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
          user-select: none;
          transition: all 0.3s ease;
        `;
        
        let isEnabled = false;
        
        button.addEventListener('click', function() {
          isEnabled = !isEnabled;
          
          if (isEnabled) {
            button.innerHTML = 'Disable @fred Bot';
            button.style.background = '#f02849';
            alert('✅ @fred Bot is now ENABLED!\n\nType @fred in any chat to test.');
            console.log('@fred Bot: ENABLED');
          } else {
            button.innerHTML = 'Enable @fred Bot';
            button.style.background = '#1877f2';
            alert('@fred Bot is now DISABLED');
            console.log('@fred Bot: DISABLED');
          }
          
          localStorage.setItem('fred-bot-enabled', isEnabled);
        });
        
        document.body.appendChild(button);
        console.log('@fred Bot: Floating button added');
        
        // Message detection
        setInterval(() => {
          if (!isEnabled) return;
          
          const messages = document.querySelectorAll('[data-testid="message_text"], .ni8dbmo4.stjgntxs, [class*="message"]');
          
          messages.forEach(message => {
            if (message.hasAttribute('data-fred-checked')) return;
            
            const text = (message.textContent || message.innerText || '').toLowerCase();
            if (text.includes('@fred')) {
              message.setAttribute('data-fred-checked', 'true');
              console.log('@fred Bot: Found mention:', text);
              
              // Send to Moltbot
              fetch(gatewayUrl + 'api/v1/sessions/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionKey: sessionKey,
                  message: `Facebook Messenger - @fred mentioned:\n${text}`,
                  timeoutSeconds: 30
                })
              }).then(response => response.json())
                .then(data => {
                  const reply = data.response || 'Got your message!';
                  console.log('@fred Bot: Response:', reply);
                  alert(`@fred Bot Response:\n${reply}`);
                })
                .catch(error => {
                  console.error('@fred Bot Error:', error);
                  alert('Error getting response from Moltbot');
                });
            }
          });
        }, 1000);
        
        return {
          success: true,
          message: '@fred Bot injected successfully!',
          buttonAdded: true
        };
      },
      args: [settings.gatewayUrl, settings.sessionKey]
    }).then(result => {
      const data = result[0].result;
      log('Injection result: ' + JSON.stringify(data));
      showStatus('✅ Bot injected successfully!', 'success');
      alert('✅ @fred Bot has been injected!\n\nLook for the blue button on the page and click it to enable.');
    }).catch(error => {
      log('Injection failed: ' + error.message);
      showStatus('❌ Injection failed: ' + error.message, 'error');
    });
  });
});

// Log startup
log('Popup loaded and ready');