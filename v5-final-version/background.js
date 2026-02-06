// Background script for @fred Bot V5.3.0 - CORS FIXED VERSION
console.log('🤖 @fred Bot Background: VERSION 5.3.0 LOADED - CORS Fixed!');

// Log extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎉 @fred Bot V5.1.0: Extension installed/updated successfully!');
});

// Log when extension starts
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 @fred Bot V5.1.0: Extension started');
});

// Monitor tab updates to log Facebook/Messenger visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('facebook.com') || tab.url.includes('messenger.com')) {
      console.log('📱 @fred Bot V5.1.0: Facebook/Messenger tab detected:', tab.url);
    }
  }
});

// Handle messages from popup (for debugging)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 @fred Bot V5.1.0: Message received:', request);
  
  if (request.action === 'getVersion') {
    sendResponse({ version: '5.1.0', isNew: true });
  }
  
  return true;
});

console.log('✅ @fred Bot Background V5.1.0: Fully initialized and ready!');