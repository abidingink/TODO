// VERSION 5.5.0 - Clean version with button issues fixed
console.log('🤖 @fred Bot Popup: VERSION 5.5.0 - Clean & Fixed!');

let debugLog = ['=== VERSION 5.5.0 DEBUG LOG - Clean & Fixed ==='];
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
    showStatus('🔧 VERSION 5.5.0 - Clean & Fixed! Enter your settings.', 'info');
  } else {
    showStatus('✅ Settings loaded - Version 5.5.0 Clean & Fixed!', 'success');
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
    showStatus('✅ Settings saved - Version 5.5.0 Clean & Fixed!', 'success');
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
      input: "Connection test from @fred Bot extension VERSION 5.5.0",
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

// Inject bot - simplified and reliable
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
    
    // Simple injection script
    const injectionScript = `
      (function() {
        console.log('🤖 @fred Bot: VERSION 5.5.0 SIMPLE INJECTION');
        
        // Remove existing button
        const existingButton = document.getElementById('fred-floating-button');
        if (existingButton) {
          existingButton.remove();
        }
        
        // Create simple button
        const button = document.createElement('button');
        button.id = 'fred-floating-button';
        button.textContent = 'Enable @fred Bot';
        button.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #1877f2; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; z-index: 999999;';
        
        let isEnabled = false;
        
        button.onclick = function() {
          isEnabled = !isEnabled;
          button.textContent = isEnabled ? 'Disable @fred Bot' : 'Enable @fred Bot';
          button.style.background = isEnabled ? '#f02849' : '#1877f2';
          alert(isEnabled ? 'Bot enabled! Type @fred to test.' : 'Bot disabled.');
          localStorage.setItem('fred-bot-enabled', isEnabled);
        };
        
        document.body.appendChild(button);
        console.log('Simple button added successfully!');
      })();
    `;
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: new Function(injectionScript)
    }).then(result => {
      showStatus('✅ Bot injected successfully!', 'success');
      alert('✅ Bot injected! Look for the blue button on the page.');
    }).catch(error => {
      showStatus('❌ Injection failed: ' + error.message, 'error');
      log('Injection error: ' + error.message, 'error');
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

log('🚀 VERSION 5.5.0 Clean & Fixed fully loaded!', 'success');