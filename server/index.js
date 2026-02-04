import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MessengerService } from './services/messenger.js';
import { SessionManager } from './services/session.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../dist')));

// State
const messengerService = new MessengerService();
const sessionManager = new SessionManager();
const clients = new Set();

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected');
  
  // Send current status
  ws.send(JSON.stringify({
    type: 'status',
    data: messengerService.getStatus()
  }));

  ws.on('message', async (message) => {
    try {
      const { action, payload } = JSON.parse(message);
      
      switch (action) {
        case 'getStatus':
          ws.send(JSON.stringify({
            type: 'status',
            data: messengerService.getStatus()
          }));
          break;
          
        case 'getConversations':
          const conversations = messengerService.getConversations();
          ws.send(JSON.stringify({
            type: 'conversations',
            data: conversations
          }));
          break;
          
        case 'getMessages':
          const messages = messengerService.getMessages(payload.threadId);
          ws.send(JSON.stringify({
            type: 'messages',
            data: { threadId: payload.threadId, messages }
          }));
          break;
          
        case 'sendMessage':
          await messengerService.sendMessage(payload.threadId, payload.text);
          break;
          
        case 'setAutoReply':
          messengerService.setAutoReply(payload.enabled);
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: error.message }
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// Event forwarding from messenger service
messengerService.on('status', (status) => {
  broadcast({ type: 'status', data: status });
});

messengerService.on('message', (message) => {
  broadcast({ type: 'newMessage', data: message });
});

messengerService.on('conversations', (conversations) => {
  broadcast({ type: 'conversations', data: conversations });
});

messengerService.on('loginRequired', (data) => {
  broadcast({ type: 'loginRequired', data });
});

messengerService.on('screenshot', (data) => {
  broadcast({ type: 'screenshot', data });
});

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json(messengerService.getStatus());
});

app.post('/api/login/start', async (req, res) => {
  try {
    const result = await messengerService.startLogin();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login/credentials', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await messengerService.submitCredentials(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login/2fa', async (req, res) => {
  try {
    const { code } = req.body;
    const result = await messengerService.submit2FA(code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    await messengerService.logout();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/screenshot', async (req, res) => {
  try {
    const screenshot = await messengerService.takeScreenshot();
    res.json({ screenshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = messengerService.getConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages/send', async (req, res) => {
  try {
    const { threadId, text } = req.body;
    await messengerService.sendMessage(threadId, text);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auto-reply', (req, res) => {
  const { enabled } = req.body;
  messengerService.setAutoReply(enabled);
  res.json({ success: true, autoReply: enabled });
});

app.post('/api/navigate', async (req, res) => {
  try {
    const { threadId } = req.body;
    await messengerService.navigateToThread(threadId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Fred Messenger server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
