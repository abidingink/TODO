/**
 * Local API Server for AI Agent Dashboard
 * 
 * This server acts as a proxy between the React dashboard and the Moltbot Gateway.
 * It handles authentication, CORS, and provides additional endpoints for account management.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 8787;
const MOLTBOT_GATEWAY_URL = process.env.MOLTBOT_GATEWAY_URL || 'http://localhost:18789';

// In-memory storage for accounts (in production, use encrypted storage)
const ACCOUNTS_FILE = path.join(__dirname, '..', 'data', 'accounts.json');

// Ensure data directory exists
const dataDir = path.dirname(ACCOUNTS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load accounts from file
let accounts = [];
try {
  if (fs.existsSync(ACCOUNTS_FILE)) {
    accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load accounts:', err);
  accounts = [];
}

// Save accounts to file
const saveAccounts = () => {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error('Failed to save accounts:', err);
  }
};

// Simple encryption for sensitive data (use proper encryption in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'ai-agent-dashboard-default-key-32';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text; // Return original if decryption fails
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400'
};

// Parse JSON body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
};

// Proxy request to Moltbot Gateway
const proxyToGateway = (req, res, targetPath) => {
  const targetUrl = new URL(targetPath, MOLTBOT_GATEWAY_URL);
  const protocol = targetUrl.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host
    }
  };

  const proxyReq = protocol.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, { ...proxyRes.headers, ...corsHeaders });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Gateway connection failed', details: err.message }));
  });

  req.pipe(proxyReq);
};

// Request handler
const requestHandler = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: Date.now(),
      gateway: MOLTBOT_GATEWAY_URL
    }));
    return;
  }

  // Account management endpoints
  if (pathname === '/api/accounts') {
    if (req.method === 'GET') {
      // Return accounts without passwords
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        password: '********'
      }));
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true, accounts: safeAccounts }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const newAccount = {
          id: crypto.randomUUID(),
          service: body.service,
          username: body.username,
          password: encrypt(body.password),
          email: body.email || '',
          notes: body.notes || '',
          enabled: body.enabled !== false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        accounts.push(newAccount);
        saveAccounts();
        
        res.writeHead(201, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ 
          success: true, 
          account: { ...newAccount, password: '********' } 
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }
  }

  // Single account operations
  const accountMatch = pathname.match(/^\/api\/accounts\/([^/]+)(\/status)?$/);
  if (accountMatch) {
    const accountId = accountMatch[1];
    const isStatusEndpoint = accountMatch[2] === '/status';
    const accountIndex = accounts.findIndex(a => a.id === accountId);

    if (accountIndex === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: false, error: 'Account not found' }));
      return;
    }

    if (req.method === 'GET') {
      const account = { ...accounts[accountIndex], password: '********' };
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true, account }));
      return;
    }

    if (req.method === 'PUT') {
      try {
        const body = await parseBody(req);
        const updatedAccount = {
          ...accounts[accountIndex],
          service: body.service || accounts[accountIndex].service,
          username: body.username || accounts[accountIndex].username,
          password: body.password ? encrypt(body.password) : accounts[accountIndex].password,
          email: body.email !== undefined ? body.email : accounts[accountIndex].email,
          notes: body.notes !== undefined ? body.notes : accounts[accountIndex].notes,
          enabled: body.enabled !== undefined ? body.enabled : accounts[accountIndex].enabled,
          updatedAt: Date.now()
        };
        accounts[accountIndex] = updatedAccount;
        saveAccounts();
        
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ 
          success: true, 
          account: { ...updatedAccount, password: '********' } 
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'PATCH' && isStatusEndpoint) {
      try {
        const body = await parseBody(req);
        accounts[accountIndex].enabled = body.enabled;
        accounts[accountIndex].updatedAt = Date.now();
        saveAccounts();
        
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    if (req.method === 'DELETE') {
      accounts.splice(accountIndex, 1);
      saveAccounts();
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  // Proxy other API requests to Moltbot Gateway
  if (pathname.startsWith('/api/')) {
    proxyToGateway(req, res, pathname);
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify({ error: 'Not found' }));
};

// Create and start server
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`🚀 AI Agent Dashboard API Server running on port ${PORT}`);
  console.log(`📡 Proxying to Moltbot Gateway at ${MOLTBOT_GATEWAY_URL}`);
  console.log(`🔒 Accounts stored in ${ACCOUNTS_FILE}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  saveAccounts();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});