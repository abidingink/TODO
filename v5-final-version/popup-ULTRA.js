// VERSION 5.6.0 - Ultra-robust with detailed debugging
console.log('🤖 @fred Bot Popup: VERSION 5.6.0 - Ultra-Robust with Debugging!');

let debugLog = ['=== VERSION 5.6.0 DEBUG LOG - Ultra-Robust ==='];
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
    showStatus('🔧 VERSION 5.6.0 - Ultra-Robust! Enter your settings.', 'info');
  } else {
    showStatus('✅ Settings loaded - Version 5.6.0 Ultra-Robust!', 'success');
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
  
  log('Saving to Chrome storage...', 'info');
  chrome.storage.sync.set(settings, function() {
    if (chrome.runtime.lastError) {
      log('Save error: ' + chrome.runtime.lastError.message, 'error');
      showStatus('❌ Save failed', 'error');
    } else {
      log('Settings saved successfully', 'success');
      showStatus('✅ Settings saved - Version 5.6.0 Ultra-Robust!', 'success');
    }
  });
});

// Test connection
document.getElementById('testConnection').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('❌ Please save settings first', 'error');
    return;
  }
  
  log('Testing connection...', 'info');
  showStatus('🧪 Testing connection...', 'info');
  
  const testUrl = settings.gatewayUrl + 'v1/responses';
  
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
      input: "Connection test from @fred Bot extension VERSION 5.6.0",
      user: "test_user"
    })
  }).then(response => {
    log('Response received - Status: ' + response.status, 'info');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' - ' + response.statusText);
    }
    return response.json();
  }).then(data => {
    log('Connection test SUCCESSFUL!', 'success');
    showStatus('✅ Connection successful!', 'success');
  }).catch(error => {
    log('Connection test FAILED: ' + error.message, 'error');
    showStatus('❌ Connection failed: ' + error.message, 'error');
  });
});

// Inject bot - ultra-robust with detailed debugging
document.getElementById('injectBot').addEventListener('click', function() {
  if (!settings.gatewayUrl || !settings.sessionKey) {
    showStatus('❌ Please save settings first', 'error');
    return;
  }
  
  log('Injecting bot...', 'info');
  showStatus('🚀 Injecting bot into current tab...', 'info');
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      log('No active tab found', 'error');
      showStatus('❌ No active tab found', 'error');
      return;
    }
    
    const tab = tabs[0];
    log('Injecting into tab: ' + tab.url, 'info');
    log('Tab ID: ' + tab.id, 'debug');
    
    if (!tab.url.includes('facebook.com') && !tab.url.includes('messenger.com')) {
      log('Wrong domain: ' + tab.url, 'error');
      showStatus('❌ This only works on Facebook/Messenger pages', 'error');
      return;
    }
    
    // Ultra-robust injection with step-by-step debugging
    const injectionScript = `
      (function() {
        console.log('=== @fred Bot V5.6.0 Injection Starting ===');
        console.log('URL: ' + window.location.href);
        console.log('Domain: ' + window.location.hostname);
        
        // Step 1: Check if we can access the document
        try {
          console.log('Document readyState: ' + document.readyState);
          console.log('Document body exists: ' + !!document.body);
        } catch (e) {
          console.error('Cannot access document:', e);
          return {success: false, error: 'Cannot access document'};
        }
        
        // Step 2: Remove existing button
        try {
          const existingButton = document.getElementById('fred-floating-button');
          if (existingButton) {
            console.log('Removing existing button');
            existingButton.remove();
          }
        } catch (e) {
          console.error('Error removing existing button:', e);
        }
        
        // Step 3: Wait for document to be ready
        function addButton() {
          try {
            console.log('Adding button to document...');
            
            // Create simple button
            const button = document.createElement('button');
            button.id = 'fred-floating-button';
            button.textContent = 'Enable @fred Bot';
            button.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #1877f2; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; z-index: 999999; font-family: Arial; font-size: 14px;';
            
            let isEnabled = false;
            
            button.onclick = function() {
              console.log('Button clicked!');
              isEnabled = !isEnabled;
              button.textContent = isEnabled ? 'Disable @fred Bot' : 'Enable @fred Bot';
              button.style.background = isEnabled ? '#f02849' : '#1877f2';
              alert(isEnabled ? '✅ Bot enabled! Type @fred in any chat to test.' : 'Bot disabled.');
              localStorage.setItem('fred-bot-enabled', isEnabled);
              console.log('Button state changed to: ' + (isEnabled ? 'enabled' : 'disabled'));
            };
            
            document.body.appendChild(button);
            console.log('Button added successfully!');
            
            return {success: true, message: 'Button added successfully'};
            
          } catch (e) {
            console.error('Error adding button:', e);
            return {success: false, error: 'Error adding button: ' + e.message};
          }
        }
        
        // Try to add button immediately
        if (document.body) {
          console.log('Document.body exists, adding button now');
          return addButton();
        } else {
          console.log('Document.body not ready, waiting...');
          setTimeout(addButton, 1000);
          return {success: true, message: 'Waiting for document to be ready'};
        }
      })();
    `;
    
    log('Executing injection script...', 'info');
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: new Function(injectionScript)
    }).then(result => {
      const data = result[0].result;
      log('Injection result: ' + JSON.stringify(data), 'debug');
      
      if (data && data.success) {
        log('Button injected successfully!', 'success');
        showStatus('✅ Button injected successfully!', 'success');
        alert('✅ Button added! Look for the blue "Enable @fred Bot" button on the page.');
      } else {
        log('Injection completed with message: ' + (data.message || 'unknown'), 'info');
        showStatus('ℹ️ Injection completed - check for button', 'info');
        alert('ℹ️ Injection completed! Check if the button appeared on the page.');
      }
    }).catch(error => {
      log('Injection FAILED: ' + error.message, 'error');
      showStatus('❌ Injection failed: ' + error.message, 'error');
      alert('❌ Injection failed: ' + error.message + '\\n\\nTry refreshing the page and clicking inject again.');
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
          buttonText: button ? button.textContent : null
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

log('🚀 VERSION 5.6.0 Ultra-Robust fully loaded!', 'success');