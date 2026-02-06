// NEW VERSION 5.4.0 - Simple content script that just logs
console.log('🤖 @fred Bot Content Script: VERSION 5.4.0 LOADED - CORS Fixed!');
console.log('This is the NEW version - completely rebuilt!');
console.log('Page URL:', window.location.href);
console.log('Hostname:', window.location.hostname);

// Add a visual indicator that this is the new version
const indicator = document.createElement('div');
indicator.innerHTML = '🤖 V5.1.0';
indicator.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
  z-index: 999999;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  border: 2px solid white;
  animation: fadeIn 0.5s ease-out;
`;

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
document.body.appendChild(indicator);

// Remove after 3 seconds
setTimeout(() => {
  indicator.remove();
  style.remove();
}, 3000);

console.log('✅ V5.1.0 Content script fully loaded and indicator shown!');