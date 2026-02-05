// Background script for debugging
console.log('@fred Bot Background: Service worker loaded');

// Log when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('@fred Bot Background: Extension installed/updated');
});

// Log when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && (tab.url.includes('facebook.com') || tab.url.includes('messenger.com'))) {
    console.log('@fred Bot Background: Facebook/Messenger tab updated:', tab.url);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('@fred Bot Background: Received message:', request);
  
  if (request.action === 'testInjection') {
    // Try to inject a test script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            alert('@fred Bot: Test injection from background script!');
            console.log('@fred Bot: Test injection successful!');
          }
        });
      }
    });
  }
});