// Manual control popup - works even if content script fails

let debugInfo = [];

function log(message) {
  console.log(message);
  debugInfo.push(new Date().toLocaleTimeString() + ' - ' + message);
  updateDebugDisplay();
}

function updateDebugDisplay() {
  const debugDiv = document.getElementById('debugInfo');
  debugDiv.innerHTML = debugInfo.join('<br>');
  debugDiv.style.display = 'block';
}

// Load saved settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  if (data.gatewayUrl) {
    document.getElementById('gatewayUrl').value = data.gatewayUrl;
  }
  if (data.sessionKey) {
    document.getElementById('sessionKey').value = data.sessionKey;
  }
  log('Settings loaded');
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', function() {
  const gatewayUrl = document.getElementById('gatewayUrl').value.trim();
  const sessionKey = document.getElementById('sessionKey').value.trim();
  
  if (!gatewayUrl || !sessionKey) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    gatewayUrl: gatewayUrl,
    sessionKey: sessionKey
  }, function() {
    showStatus('Settings saved!', 'success');
    log('Settings saved successfully');
  });
});

// Test injection
document.getElementById('testInjection').addEventListener('click', function() {
  log('Testing injection...');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      showStatus('No active tab found', 'error');
      return;
    }
    
    const url = tabs[0].url;
    log('Current tab URL: ' + url);
    
    if (!url.includes('facebook.com') && !url.includes('messenger.com')) {
      showStatus('This only works on Facebook/Messenger', 'error');
      return;
    }
    
    // Try to inject test code
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        console.log('@fred Bot: Test injection successful!');
        alert('✅ @fred Bot injection test successful!\n\nThe extension can inject code into this page.');
        
        // Add a test indicator
        const indicator = document.createElement('div');
        indicator.innerHTML = '🤖 @fred Bot - Ready to Enable';
        indicator.style.cssText = `
          position: fixed;
          top: 50px;
          right: 20px;
          background: #1877f2;
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          z-index: 999999;
          font-family: Arial;
          font-size: 14px;
          cursor: pointer;
        `;
        
        indicator.addEventListener('click', () => {
          alert('Click "Inject Bot Now" in the extension popup to activate @fred Bot!');
        });
        
        document.body.appendChild(indicator);
      }
    }).then(() => {
      showStatus('Injection test successful!', 'success');
      log('Test injection completed');
    }).catch(err => {
      showStatus('Injection failed: ' + err.message, 'error');
      log('Test injection failed: ' + err.message);
    });
  });
});

// Manual inject
document.getElementById('manualInject').addEventListener('click', function() {
  log('Manual injection starting...');
  
  chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
    if (!data.gatewayUrl || !data.sessionKey) {
      showStatus('Please save settings first', 'error');
      return;
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]) {
        showStatus('No active tab', 'error');
        return;
      }
      
      log('Injecting bot into tab: ' + tabs[0].id);
      
      // Inject the full bot functionality
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (gatewayUrl, sessionKey) => {
          console.log('@fred Bot: Manual injection successful!');
          console.log('@fred Bot: Settings:', { gatewayUrl, sessionKey });
          
          // Add floating button
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
          `;
          
          let isEnabled = false;
          
          button.addEventListener('click', function() {
            isEnabled = !isEnabled;
            
            if (isEnabled) {
              button.innerHTML = 'Disable @fred Bot';
              button.style.background = '#f02849';
              alert('✅ @fred Bot is now ENABLED!\n\nType @fred in any chat to test.');
            } else {
              button.innerHTML = 'Enable @fred Bot';
              button.style.background = '#1877f2';
              alert('@fred Bot is now DISABLED');
            }
            
            localStorage.setItem('fred-bot-enabled', isEnabled);
          });
          
          // Load saved state
          const savedState = localStorage.getItem('fred-bot-enabled');
          if (savedState === 'true') {
            isEnabled = true;
            button.innerHTML = 'Disable @fred Bot';
            button.style.background = '#f02849';
          }
          
          document.body.appendChild(button);
          
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
                    alert(`@fred Bot Response:\n${reply}`);
                  })
                  .catch(error => {
                    console.error('@fred Bot Error:', error);
                    alert('Error getting response from Moltbot');
                  });
              }
            });
          }, 1000);
          
          alert('✅ @fred Bot has been injected!\n\nClick the blue button to enable/disable.');
        },
        args: [data.gatewayUrl, data.sessionKey]
      }).then(() => {
        showStatus('Bot injected successfully!', 'success');
        log('Manual injection completed');
      }).catch(err => {
        showStatus('Injection failed: ' + err.message, 'error');
        log('Manual injection failed: ' + err.message);
      });
    });
  });
});

// Check status
document.getElementById('checkStatus').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      showStatus('No active tab', 'error');
      return;
    }
    
    log('Checking status for: ' + tabs[0].url);
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const button = document.getElementById('fred-floating-button');
        const indicator = document.getElementById('fred-test-indicator');
        
        return {
          hasButton: !!button,
          hasIndicator: !!indicator,
          currentUrl: window.location.href,
          messages: 'Check console for details'
        };
      }
    }).then(result => {
      const data = result[0].result;
      log('Status check results: ' + JSON.stringify(data));
      
      if (data.hasButton) {
        showStatus('Bot is active on this page!', 'success');
      } else {
        showStatus('Bot not found - click "Inject Bot Now"', 'info');
      }
    }).catch(err => {
      showStatus('Status check failed: ' + err.message, 'error');
      log('Status check failed: ' + err.message);
    });
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  
  setTimeout(() => {
    statusDiv.className = 'status info';
    statusDiv.textContent = 'Ready for next action';
  }, 3000);
}