#!/usr/bin/env node
/**
 * Local API mock server for development
 * Emulates the Cloudflare Worker API endpoints
 */

import { createServer } from 'http';

const PORT = 8787;

// In-memory storage (emulating KV)
const store = {
  config: {
    triggerWord: 'fred',
    caseSensitive: false,
    enabled: true,
    responsePrefix: '🤖 Fred: ',
    aiModel: 'gpt-4o-mini',
    maxResponseLength: 2000,
    systemPrompt: 'You are Fred, a helpful AI assistant.'
  },
  messages: [],
  stats: {
    messagesReceived: 0,
    responsesSent: 0,
    todayMessagesReceived: 0,
    todayResponsesSent: 0
  }
};

const FB_VERIFY_TOKEN = 'FRED_VERIFY_TOKEN_12345';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Content-Type': 'application/json'
};

// Parse request body
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Check if message triggers Fred
function checkTrigger(text, config) {
  const trigger = config.triggerWord;
  const regex = new RegExp('\\b' + trigger + '\\b', config.caseSensitive ? '' : 'i');
  return regex.test(text);
}

// Request handler
async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost:' + PORT);
  const path = url.pathname;
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (path === '/health') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  // Webhook verification
  if (path === '/webhook' && req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    console.log('Webhook verification:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      res.writeHead(403, corsHeaders);
      res.end('Forbidden');
    }
    return;
  }

  // Webhook event
  if (path === '/webhook' && req.method === 'POST') {
    const body = await parseBody(req);
    console.log('Webhook event:', JSON.stringify(body, null, 2));
    
    if (body.object === 'page' && body.entry) {
      for (const entry of body.entry) {
        for (const event of entry.messaging || []) {
          if (event.message?.text) {
            const msg = {
              id: event.message.mid || 'msg-' + Date.now(),
              senderId: event.sender.id,
              recipientId: event.recipient.id,
              text: event.message.text,
              timestamp: event.timestamp || Date.now(),
              isFromFred: false,
              triggeredFred: checkTrigger(event.message.text, store.config)
            };
            
            store.messages.unshift(msg);
            store.stats.messagesReceived++;
            store.stats.todayMessagesReceived++;
            
            console.log('Message from ' + msg.senderId + ': ' + msg.text);
            console.log('Triggered Fred: ' + msg.triggeredFred);
            
            if (msg.triggeredFred && store.config.enabled) {
              // Simulate AI response
              const response = {
                id: 'fred-' + Date.now(),
                senderId: 'fred',
                recipientId: msg.senderId,
                text: store.config.responsePrefix + "Hello! I'm Fred, your AI assistant. How can I help you today?",
                timestamp: Date.now(),
                isFromFred: true,
                triggeredFred: false
              };
              store.messages.unshift(response);
              store.stats.responsesSent++;
              store.stats.todayResponsesSent++;
              console.log('Fred response:', response.text);
            }
          }
        }
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('EVENT_RECEIVED');
    return;
  }

  // API endpoints
  if (path.startsWith('/api/')) {
    const apiPath = path.replace('/api/', '');
    
    // Messages
    if (apiPath === 'messages' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ messages: store.messages.slice(0, limit) }));
      return;
    }
    
    // Config
    if (apiPath === 'config') {
      if (req.method === 'GET') {
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({ config: store.config }));
        return;
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        store.config = { ...store.config, ...body };
        console.log('Config updated:', store.config);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({ config: store.config }));
        return;
      }
    }
    
    // Stats
    if (apiPath === 'stats') {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({
        stats: {
          total: {
            messagesReceived: store.stats.messagesReceived,
            responsesSent: store.stats.responsesSent
          },
          today: {
            messagesReceived: store.stats.todayMessagesReceived,
            responsesSent: store.stats.todayResponsesSent
          }
        }
      }));
      return;
    }
    
    // Conversations
    if (apiPath === 'conversations') {
      const senderIds = [...new Set(store.messages.filter(m => !m.isFromFred).map(m => m.senderId))];
      const conversations = senderIds.map(id => {
        const msgs = store.messages.filter(m => m.senderId === id || m.recipientId === id);
        return {
          id,
          lastMessage: msgs[0]?.text || '',
          lastTimestamp: msgs[0]?.timestamp || 0,
          messageCount: msgs.length
        };
      });
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ conversations }));
      return;
    }
    
    // Test endpoint
    if (apiPath === 'test') {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        config: store.config,
        note: 'This is a local mock server'
      }));
      return;
    }
    
    // Setup key (mock)
    if (apiPath === 'setup-key' && req.method === 'POST') {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  // Default response
  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify({ 
    message: 'Fred Messenger Local API Server', 
    endpoints: ['/health', '/webhook', '/api/messages', '/api/config', '/api/stats'] 
  }));
}

// Create server
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log('');
  console.log('🤖 Fred Messenger Local API Server');
  console.log('==================================');
  console.log('Server running at http://localhost:' + PORT);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /health           - Health check');
  console.log('  GET  /webhook          - Facebook webhook verification');
  console.log('  POST /webhook          - Facebook webhook events');
  console.log('  GET  /api/messages     - Get messages');
  console.log('  GET  /api/config       - Get config');
  console.log('  POST /api/config       - Update config');
  console.log('  GET  /api/stats        - Get statistics');
  console.log('  GET  /api/test         - Test endpoint');
  console.log('');
  console.log('Test with:');
  console.log('  node scripts/test-webhook.js');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
