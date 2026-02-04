/**
 * Fred Messenger - Cloudflare Worker
 * 
 * Handles Facebook Messenger webhooks and AI responses
 */

interface Env {
  FRED_KV: KVNamespace;
  FB_VERIFY_TOKEN: string;
  FB_PAGE_ACCESS_TOKEN: string;
  FB_APP_SECRET: string;
  OPENAI_API_KEY: string;
  FRED_TRIGGER: string;
  AI_MODEL: string;
  RESPONSE_PREFIX: string;
}

interface WebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<MessagingEvent>;
  }>;
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
    attachments?: any[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}

interface StoredMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  isFromFred: boolean;
  triggeredFred: boolean;
}

interface Config {
  triggerWord: string;
  caseSensitive: boolean;
  enabled: boolean;
  responsePrefix: string;
  aiModel: string;
  maxResponseLength: number;
  systemPrompt: string;
}

const DEFAULT_CONFIG: Config = {
  triggerWord: 'fred',
  caseSensitive: false,
  enabled: true,
  responsePrefix: '🤖 Fred: ',
  aiModel: 'gpt-4o-mini',
  maxResponseLength: 2000,
  systemPrompt: `You are Fred, a helpful and friendly AI assistant participating in Facebook Messenger conversations. 
You were mentioned in a conversation and should respond helpfully.
Keep responses concise and conversational - this is a chat, not an essay.
Be friendly, helpful, and a bit witty when appropriate.
If you don't know something, say so.
Never pretend to be human - you're Fred the AI assistant.`
};

// CORS headers for dashboard API
function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }

    try {
      // Route handling
      if (url.pathname === '/webhook') {
        if (request.method === 'GET') {
          return handleWebhookVerification(request, env);
        } else if (request.method === 'POST') {
          return handleWebhookEvent(request, env, ctx);
        }
      }

      // API routes for dashboard
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, env, url, origin);
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      return new Response('Fred Messenger API', {
        headers: { 'Content-Type': 'text/plain', ...corsHeaders(origin) },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};

// Facebook webhook verification
function handleWebhookVerification(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('Webhook verification:', { mode, token, challenge });

  if (mode === 'subscribe' && token === env.FB_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.log('Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

// Handle incoming webhook events
async function handleWebhookEvent(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body: WebhookEvent = await request.json();
  
  console.log('Received webhook event:', JSON.stringify(body));

  // Must respond 200 quickly to Facebook
  if (body.object !== 'page') {
    return new Response('Not a page event', { status: 200 });
  }

  // Process asynchronously to avoid timeout
  ctx.waitUntil(processWebhookEvents(body, env));

  return new Response('EVENT_RECEIVED', { status: 200 });
}

// Process webhook events asynchronously
async function processWebhookEvents(body: WebhookEvent, env: Env): Promise<void> {
  const config = await getConfig(env);

  for (const entry of body.entry) {
    for (const event of entry.messaging) {
      if (event.message?.text) {
        await processMessage(event, config, env);
      }
    }
  }
}

// Process a single message
async function processMessage(event: MessagingEvent, config: Config, env: Env): Promise<void> {
  const messageText = event.message!.text;
  const senderId = event.sender.id;
  
  console.log(`Message from ${senderId}: ${messageText}`);

  // Store the incoming message
  await storeMessage(env, {
    id: event.message!.mid,
    senderId: senderId,
    recipientId: event.recipient.id,
    text: messageText,
    timestamp: event.timestamp,
    isFromFred: false,
    triggeredFred: false,
  });

  // Check if Fred was mentioned
  const shouldRespond = checkTrigger(messageText, config);
  
  if (shouldRespond && config.enabled) {
    console.log('Fred triggered, generating response...');
    
    // Update message to mark it triggered Fred
    await storeMessage(env, {
      id: event.message!.mid,
      senderId: senderId,
      recipientId: event.recipient.id,
      text: messageText,
      timestamp: event.timestamp,
      isFromFred: false,
      triggeredFred: true,
    });

    // Generate AI response
    const response = await generateAIResponse(messageText, config, env);
    
    // Send response via Facebook API
    await sendFacebookMessage(senderId, config.responsePrefix + response, env);

    // Store Fred's response
    await storeMessage(env, {
      id: `fred-${Date.now()}`,
      senderId: 'fred',
      recipientId: senderId,
      text: config.responsePrefix + response,
      timestamp: Date.now(),
      isFromFred: true,
      triggeredFred: false,
    });

    // Update stats
    await incrementStat(env, 'responses_sent');
  }

  // Update stats
  await incrementStat(env, 'messages_received');
}

// Check if message triggers Fred
function checkTrigger(text: string, config: Config): boolean {
  const trigger = config.triggerWord;
  const messageText = config.caseSensitive ? text : text.toLowerCase();
  const triggerText = config.caseSensitive ? trigger : trigger.toLowerCase();
  
  // Check for word boundary match (not just substring)
  const regex = new RegExp(`\\b${triggerText}\\b`, config.caseSensitive ? '' : 'i');
  return regex.test(text);
}

// Generate AI response using OpenAI
async function generateAIResponse(message: string, config: Config, env: Env): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    console.log('No OpenAI API key, using fallback response');
    return "Hi! I'm Fred, but I'm not fully set up yet. My AI brain needs an API key to work properly!";
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: Math.min(config.maxResponseLength, 500),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0]?.message?.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error('AI generation error:', error);
    return "Sorry, I had trouble thinking of a response. Can you try asking again?";
  }
}

// Send message via Facebook Graph API
async function sendFacebookMessage(recipientId: string, text: string, env: Env): Promise<void> {
  if (!env.FB_PAGE_ACCESS_TOKEN) {
    console.log('No Facebook Page Access Token configured');
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${env.FB_PAGE_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: 'RESPONSE',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Facebook API error:', error);
    throw new Error(`Facebook API error: ${response.status}`);
  }

  console.log('Message sent successfully');
}

// API request handler for dashboard
async function handleApiRequest(request: Request, env: Env, url: URL, origin: string | null): Promise<Response> {
  const path = url.pathname.replace('/api/', '');
  const headers = { 'Content-Type': 'application/json', ...corsHeaders(origin) };

  // Simple API key auth for dashboard
  const apiKey = request.headers.get('X-API-Key');
  const storedKey = await env.FRED_KV.get('api_key');
  
  // Skip auth for GET requests to public endpoints
  const publicEndpoints = ['health', 'stats'];
  const isPublic = publicEndpoints.includes(path) && request.method === 'GET';
  
  if (!isPublic && storedKey && apiKey !== storedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  switch (path) {
    case 'messages': {
      if (request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const messages = await getMessages(env, limit);
        return new Response(JSON.stringify({ messages }), { headers });
      }
      break;
    }

    case 'config': {
      if (request.method === 'GET') {
        const config = await getConfig(env);
        return new Response(JSON.stringify({ config }), { headers });
      } else if (request.method === 'POST') {
        const body = await request.json() as Partial<Config>;
        const config = await updateConfig(env, body);
        return new Response(JSON.stringify({ config }), { headers });
      }
      break;
    }

    case 'stats': {
      const stats = await getStats(env);
      return new Response(JSON.stringify({ stats }), { headers });
    }

    case 'conversations': {
      const conversations = await getConversations(env);
      return new Response(JSON.stringify({ conversations }), { headers });
    }

    case 'setup-key': {
      if (request.method === 'POST') {
        const { key } = await request.json() as { key: string };
        await env.FRED_KV.put('api_key', key);
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      break;
    }

    case 'test': {
      // Test endpoint to verify worker is running
      return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: Date.now(),
        config: await getConfig(env),
      }), { headers });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers,
  });
}

// KV helper functions
async function getConfig(env: Env): Promise<Config> {
  const stored = await env.FRED_KV.get('config', 'json');
  return { ...DEFAULT_CONFIG, ...(stored || {}) };
}

async function updateConfig(env: Env, updates: Partial<Config>): Promise<Config> {
  const current = await getConfig(env);
  const updated = { ...current, ...updates };
  await env.FRED_KV.put('config', JSON.stringify(updated));
  return updated;
}

async function storeMessage(env: Env, message: StoredMessage): Promise<void> {
  // Store individual message
  await env.FRED_KV.put(`msg:${message.id}`, JSON.stringify(message), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });

  // Add to message list (last 1000 messages)
  const listKey = 'messages:list';
  const list = await env.FRED_KV.get(listKey, 'json') as string[] || [];
  list.unshift(message.id);
  if (list.length > 1000) list.pop();
  await env.FRED_KV.put(listKey, JSON.stringify(list));

  // Store by conversation
  const convKey = `conv:${message.senderId}`;
  const conv = await env.FRED_KV.get(convKey, 'json') as string[] || [];
  conv.unshift(message.id);
  if (conv.length > 100) conv.pop();
  await env.FRED_KV.put(convKey, JSON.stringify(conv));
}

async function getMessages(env: Env, limit: number = 50): Promise<StoredMessage[]> {
  const list = await env.FRED_KV.get('messages:list', 'json') as string[] || [];
  const messages: StoredMessage[] = [];
  
  for (const id of list.slice(0, limit)) {
    const msg = await env.FRED_KV.get(`msg:${id}`, 'json') as StoredMessage;
    if (msg) messages.push(msg);
  }
  
  return messages;
}

async function getConversations(env: Env): Promise<any[]> {
  // Get unique sender IDs from recent messages
  const messages = await getMessages(env, 100);
  const senderIds = [...new Set(messages.filter(m => !m.isFromFred).map(m => m.senderId))];
  
  return senderIds.map(id => {
    const senderMessages = messages.filter(m => m.senderId === id || m.recipientId === id);
    const lastMessage = senderMessages[0];
    return {
      id,
      lastMessage: lastMessage?.text || '',
      lastTimestamp: lastMessage?.timestamp || 0,
      messageCount: senderMessages.length,
    };
  });
}

async function incrementStat(env: Env, stat: string): Promise<void> {
  const key = `stat:${stat}`;
  const current = parseInt(await env.FRED_KV.get(key) || '0');
  await env.FRED_KV.put(key, String(current + 1));
  
  // Also track daily stats
  const today = new Date().toISOString().split('T')[0];
  const dailyKey = `stat:${stat}:${today}`;
  const dailyCurrent = parseInt(await env.FRED_KV.get(dailyKey) || '0');
  await env.FRED_KV.put(dailyKey, String(dailyCurrent + 1), {
    expirationTtl: 60 * 60 * 24 * 90, // 90 days
  });
}

async function getStats(env: Env): Promise<any> {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total: {
      messagesReceived: parseInt(await env.FRED_KV.get('stat:messages_received') || '0'),
      responsesSent: parseInt(await env.FRED_KV.get('stat:responses_sent') || '0'),
    },
    today: {
      messagesReceived: parseInt(await env.FRED_KV.get(`stat:messages_received:${today}`) || '0'),
      responsesSent: parseInt(await env.FRED_KV.get(`stat:responses_sent:${today}`) || '0'),
    },
  };
}
