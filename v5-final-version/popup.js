// VERSION 5.3.0 - Enhanced with CORS error handling and better debugging
console.log('🤖 @fred Bot Popup: VERSION 5.3.0 - CORS Enhanced!');

let debugLog = ['=== VERSION 5.3.0 DEBUG LOG - CORS ENHANCED ==='];
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
    showStatus('🔧 VERSION 5.3.0 - CORS Enhanced! Enter your settings.', 'info');
  } else {
    showStatus('✅ Settings loaded - Version 5.3.0 CORS Enhanced!', 'success');
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
    showStatus('✅ Settings saved - Version 5.3.0 CORS Enhanced!', 'success');
    log('Settings saved successfully', 'success');
  });
});

// Test connection with CORS handling
document.getElementById('testConnection').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('❌ Please save settings first', 'error');
    return;
  }
  
  log('Testing connection with CORS handling...', 'info');
  showStatus('🧪 Testing connection (CORS aware)...', 'info');
  
  const testUrl = settings.gatewayUrl + 'v1/responses';
  
  // Add CORS-friendly headers
  fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + settings.sessionKey,
      'x-moltbot-agent-id': 'main'
    },
    body: JSON.stringify({
      model: "moltbot",
      input: "Connection test from @fred Bot extension VERSION 5.3.0 - CORS Enhanced",
      user: "test_user"
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
    showStatus('✅ Connection successful! CORS is working.', 'success');
  }).catch(error => {
    log('Connection test FAILED: ' + error.message, 'error');
    log('Full error: ' + error.stack, 'debug');
    
    if (error.message.includes('CORS') || error.message.includes('blocked')) {
      showStatus('❌ CORS Error: ' + error.message + '\n\nThe server needs CORS configured for Chrome extensions.', 'error');
      log('CORS ERROR DETECTED - Server needs Access-Control-Allow-Origin header', 'error');
    } else {
      showStatus('❌ Connection failed: ' + error.message, 'error');
    }
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
        console.log('🤖 @fred Bot: VERSION 5.3.0 CORS ENHANCED INJECTION');
        
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
            alert('✅ @fred Bot VERSION 5.3.0 CORS ENHANCED is now ENABLED!\n\nType @fred in any chat to test.');
          } else {
            button.innerHTML = '🤖 Enable @fred Bot';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            alert('@fred Bot is now DISABLED');
          }
          
          localStorage.setItem('fred-bot-enabled-v5', isEnabled);
        });
        
        document.body.appendChild(button);
        
        // Enhanced message detection with 1-on-1 chat support
        let messageCheckCount = 0;
        let validMessagesFound = 0;
        
        setInterval(() => {
          if (!isEnabled) return;
          
          messageCheckCount++;
          
          // More comprehensive selectors for Facebook Messenger
          const MESSAGE_SELECTORS = [
            '[data-testid="message_text"]',
            '.ni8dbmo4.stjgntxs',
            '[class*="message"]', 
            '[data-pagelet] [class*="message"]',
            '[role="main"] [class*="message"]',
            '[data-testid="message-container"]',
            // 1-on-1 chat specific selectors
            '[data-testid="conversation_container"] [class*="message"]',
            '[aria-label*="message"]',
            // Any text container that could be a message
            'div[dir="auto"]',
            'span[dir="auto"]'
          ];
          
          let allMessages = [];
          
          // Try each selector and combine results
          for (let selector of MESSAGE_SELECTORS) {
            try {
              const found = document.querySelectorAll(selector);
              if (found.length > 0) {
                allMessages = allMessages.concat(Array.from(found));
              }
            } catch (e) {
              console.log(`[DEBUG] Selector failed: ${selector}`, e);
            }
          }
          
          // Remove duplicates
          allMessages = [...new Set(allMessages)];
          
          // Debug: Show what we found
          if (allMessages.length > 0 && messageCheckCount <= 10) {
            console.log(`[DEBUG] Found ${allMessages.length} potential messages using selectors`);
          }
          
          allMessages.forEach((message, index) => {
            if (message.hasAttribute('data-fred-checked-v5')) return;
            
            let text = '';
            try {
              text = (message.textContent || message.innerText || '').toLowerCase();
            } catch (e) {
              console.log(`[DEBUG] Could not get text from message ${index}`);
              return;
            }
            
            // Debug: Show first 10 messages we check
            if (index < 10 && messageCheckCount <= 5) {
              console.log(`[DEBUG] Checking message ${index}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            }
            
            // More lenient detection for 1-on-1 chats
            const isMention = text.includes('@fred');
            const isDirectMessage = text.length > 3; // Shorter minimum for 1-on-1
            const hasContent = text.trim().length > 0;
            const isNotEmpty = text.length > 3;
            
            if ((isMention || (isDirectMessage && hasContent)) && isNotEmpty) {
              message.setAttribute('data-fred-checked-v5', 'true');
              validMessagesFound++;
              console.log(`[DEBUG] FOUND MESSAGE #${validMessagesFound}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
              console.log(`[DEBUG] Message type: ${isMention ? 'MENTION' : 'DIRECT MESSAGE'} | Length: ${text.length}`);
              
              // Process this message
              processMessage(text, message);
              
              // Send to Moltbot with enhanced format
              fetch(gatewayUrl + 'v1/responses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': 'Bearer ' + sessionKey,
                  'x-moltbot-agent-id': 'main'
                },
                body: JSON.stringify({
                  model: "moltbot",
                  input: `[FB_MESSENGER] [CHAT_ID:${window.location.pathname}] [@fred mention] ${text}`,
                  context: {
                    source: "messenger_extension",
                    platform: "facebook_messenger",
                    chat_id: window.location.pathname,
                    sender: "facebook_user",
                    timestamp: new Date().toISOString(),
                    can_respond_independently: true,
                    is_autonomous: true
                  },
                  user: "messenger_extension_user"
                })
              }).then(response => response.json())
              .then(data => {
                const reply = data.response || 'Got your message!';
                alert(`🤖 @fred Bot Response:\n\n${reply}`);
              })
              .catch(error => {
                console.error('Error:', error);
                if (error.message.includes('CORS') || error.message.includes('blocked')) {
                  alert('❌ CORS Error: Unable to connect to server.\n\nThe server may need CORS configuration.');
                } else {
                  alert('❌ Error getting response from Moltbot');
                }
              });
            }
          });
        }, 500); // Check more frequently for better detection
        
        return {
          success: true,
          message: '@fred Bot V5.3.0 with enhanced 1-on-1 chat support injected successfully!'
        };
        };
      },
      args: [settings.gatewayUrl, settings.sessionKey]
    }).then(result => {
      showStatus('✅ Bot injected successfully!', 'success');
      alert('🎉 SUCCESS!\n\n@fred Bot VERSION 5.3.0 CORS ENHANCED has been injected!\n\nClick the purple button to enable.');
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

log('🚀 VERSION 5.3.0 CORS ENHANCED fully loaded!', 'success');

// Process message function for enhanced detection
function processMessage(text, messageElement) {
  console.log(`[DEBUG] Processing message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  // Send to Moltbot
  fetch(settings.gatewayUrl + 'v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + settings.sessionKey,
      'x-moltbot-agent-id': 'main'
    },
    body: JSON.stringify({
      model: "moltbot",
      input: `[FB_MESSENGER] [CHAT_ID:${window.location.pathname}] [@fred mention] ${text}`,
      context: {
        source: "messenger_extension",
        platform: "facebook_messenger",
        chat_id: window.location.pathname,
        sender: "facebook_user",
        timestamp: new Date().toISOString(),
        can_respond_independently: true,
        is_autonomous: true,
        message_type: text.includes('@fred') ? 'mention' : 'direct'
      },
      user: "messenger_extension_user"
    })
  }).then(response => response.json())
  .then(data => {
    const reply = data.response || data.output?.[0]?.content?.[0]?.text || 'Got your message!';
    console.log(`[DEBUG] AI Response: "${reply.substring(0, 100)}${reply.length > 100 ? '...' : ''}"`);
    alert(`🤖 @fred Bot Response:\n\n${reply}`);
  })
  .catch(error => {
    console.error('[DEBUG] Error getting response:', error);
    alert('❌ Error getting response from Moltbot');
  });
}