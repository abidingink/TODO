// Test if extension is loading at all
console.log('@fred Bot: CONTENT SCRIPT LOADED - Version Test');

// Immediate test
alert('@fred Bot Extension Loaded! If you see this, the extension is working.');

// Add a visible indicator
const indicator = document.createElement('div');
indicator.id = 'fred-test-indicator';
indicator.innerHTML = '🤖 @fred Bot Loaded';
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: red;
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 999999;
  font-family: Arial;
  font-size: 16px;
`;
document.body.appendChild(indicator);

// Keep trying to add the button
setInterval(() => {
  if (!document.getElementById('fred-floating-button')) {
    addButton();
  }
}, 1000);

function addButton() {
  console.log('@fred Bot: Trying to add button...');
  
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
  `;
  
  button.addEventListener('click', () => {
    alert('@fred Button Clicked! Extension is working.');
    console.log('@fred Bot: Button clicked!');
  });
  
  document.body.appendChild(button);
  console.log('@fred Bot: Button added!');
}

// Also try immediate injection
try {
  addButton();
} catch (e) {
  console.error('@fred Bot Error:', e);
}