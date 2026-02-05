// Popup script - handles settings
let gatewayUrlInput = document.getElementById('gatewayUrl');
let sessionKeyInput = document.getElementById('sessionKey');
let saveButton = document.getElementById('saveSettings');
let statusDiv = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['gatewayUrl', 'sessionKey'], function(data) {
  if (data.gatewayUrl) {
    gatewayUrlInput.value = data.gatewayUrl;
  }
  if (data.sessionKey) {
    sessionKeyInput.value = data.sessionKey;
  }
});

// Save settings
saveButton.addEventListener('click', function() {
  let gatewayUrl = gatewayUrlInput.value.trim();
  let sessionKey = sessionKeyInput.value.trim();
  
  if (!gatewayUrl || !sessionKey) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  // Ensure URL ends with /
  if (!gatewayUrl.endsWith('/')) {
    gatewayUrl += '/';
  }
  
  chrome.storage.sync.set({
    gatewayUrl: gatewayUrl,
    sessionKey: sessionKey
  }, function() {
    showStatus('Settings saved successfully!', 'success');
    
    // Notify content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'settingsUpdated',
        gatewayUrl: gatewayUrl,
        sessionKey: sessionKey
      });
    });
  });
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  setTimeout(function() {
    statusDiv.style.display = 'none';
  }, 3000);
}