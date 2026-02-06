// Enhanced message detection for 1-on-1 chats and better debugging

console.log('[DEBUG] Starting enhanced message detection for version 5.3+');

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

let messageCheckCount = 0;
let validMessagesFound = 0;

function detectMessagesEnhanced() {
  if (!isEnabled) return;
  
  messageCheckCount++;
  
  // Log every 50 checks to avoid spam
  if (messageCheckCount % 50 === 0) {
    console.log(`[DEBUG] Message detection check #${messageCheckCount}, found ${validMessagesFound} valid messages so far`);
  }
  
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
  
  if (allMessages.length === 0) {
    if (messageCheckCount % 100 === 0) {
      console.log('[DEBUG] No messages found with any selector');
    }
    return;
  }
  
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
    }
  });
}

function processMessage(text, messageElement) {
  console.log(`[DEBUG] Processing message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  // Send to Moltbot
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

// Start enhanced detection
console.log('[DEBUG] Starting enhanced message detection');
setInterval(detectMessagesEnhanced, 500); // Check more frequently initially