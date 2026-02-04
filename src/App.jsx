import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Configuration - Update this for production
const getApiUrl = () => {
  // In development, use local worker
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  // In production, use the worker URL (set via environment or config)
  return window.FRED_API_URL || 'https://fred-messenger-api.workers.dev';
};

const API_URL = getApiUrl();

function App() {
  const [status, setStatus] = useState('loading');
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState(localStorage.getItem('fred_api_key') || '');
  const [error, setError] = useState(null);
  const [setupMode, setSetupMode] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  // API call helper
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid API key');
          return null;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('API call failed:', err);
      setError(err.message);
      return null;
    }
  }, [apiKey]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setError(null);
      
      // Check worker health
      try {
        const health = await fetch(`${API_URL}/health`);
        if (!health.ok) {
          setStatus('offline');
          setError('Worker is offline');
          return;
        }
      } catch (err) {
        setStatus('offline');
        setError('Cannot connect to worker');
        return;
      }

      // Load config
      const configData = await apiCall('config');
      if (configData) {
        setConfig(configData.config);
      }

      // Load stats
      const statsData = await apiCall('stats');
      if (statsData) {
        setStats(statsData.stats);
      }

      // Load messages
      const messagesData = await apiCall('messages?limit=50');
      if (messagesData) {
        setMessages(messagesData.messages);
      }

      // Load conversations
      const convData = await apiCall('conversations');
      if (convData) {
        setConversations(convData.conversations);
      }

      setStatus('connected');
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [apiCall]);

  // Update config
  const updateConfig = async (updates) => {
    const result = await apiCall('config', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    
    if (result) {
      setConfig(result.config);
    }
  };

  // Setup API key
  const setupApiKey = async () => {
    if (!newApiKey) return;
    
    const response = await fetch(`${API_URL}/api/setup-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newApiKey }),
    });
    
    if (response.ok) {
      setApiKey(newApiKey);
      localStorage.setItem('fred_api_key', newApiKey);
      setSetupMode(false);
      setNewApiKey('');
    }
  };

  // Save API key to localStorage
  const saveApiKey = () => {
    localStorage.setItem('fred_api_key', apiKey);
    window.location.reload();
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render dashboard tab
  const renderDashboard = () => (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.total?.messagesReceived || 0}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.total?.responsesSent || 0}</div>
            <div className="stat-label">Fred Responses</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.today?.messagesReceived || 0}</div>
            <div className="stat-label">Today's Messages</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.today?.responsesSent || 0}</div>
            <div className="stat-label">Today's Responses</div>
          </div>
        </div>
      </div>

      <div className="status-panel">
        <h3>System Status</h3>
        <div className="status-items">
          <div className="status-item">
            <span className={`status-dot ${status === 'connected' ? 'green' : 'red'}`}></span>
            <span>Worker: {status === 'connected' ? 'Online' : 'Offline'}</span>
          </div>
          <div className="status-item">
            <span className={`status-dot ${config?.enabled ? 'green' : 'yellow'}`}></span>
            <span>Auto-Reply: {config?.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="status-item">
            <span className="status-dot blue"></span>
            <span>Trigger: "{config?.triggerWord || 'fred'}"</span>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {messages.slice(0, 5).map((msg, i) => (
            <div key={msg.id || i} className={`activity-item ${msg.isFromFred ? 'from-fred' : ''}`}>
              <div className="activity-icon">
                {msg.isFromFred ? '🤖' : msg.triggeredFred ? '📣' : '💬'}
              </div>
              <div className="activity-content">
                <div className="activity-text">{msg.text.substring(0, 100)}...</div>
                <div className="activity-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="empty-state">No messages yet</div>
          )}
        </div>
      </div>
    </div>
  );

  // Render messages tab
  const renderMessages = () => (
    <div className="messages-panel">
      <h3>Message History</h3>
      <div className="message-list">
        {messages.map((msg, i) => (
          <div 
            key={msg.id || i} 
            className={`message-item ${msg.isFromFred ? 'from-fred' : 'from-user'}`}
          >
            <div className="message-header">
              <span className="message-sender">
                {msg.isFromFred ? '🤖 Fred' : `👤 ${msg.senderId.substring(0, 8)}...`}
              </span>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="message-text">{msg.text}</div>
            {msg.triggeredFred && !msg.isFromFred && (
              <div className="message-badge">Triggered Fred</div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="empty-state">
            <p>No messages yet.</p>
            <p>Messages will appear here when users interact with your Facebook Page.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render config tab
  const renderConfig = () => (
    <div className="config-panel">
      <h3>Configuration</h3>
      
      {config ? (
        <div className="config-form">
          <div className="config-group">
            <label>Auto-Reply Enabled</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </div>
          </div>

          <div className="config-group">
            <label>Trigger Word</label>
            <input
              type="text"
              value={config.triggerWord}
              onChange={(e) => updateConfig({ triggerWord: e.target.value })}
              placeholder="fred"
            />
            <small>Fred will respond when this word is mentioned</small>
          </div>

          <div className="config-group">
            <label>Case Sensitive</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={config.caseSensitive}
                onChange={(e) => updateConfig({ caseSensitive: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </div>
          </div>

          <div className="config-group">
            <label>Response Prefix</label>
            <input
              type="text"
              value={config.responsePrefix}
              onChange={(e) => updateConfig({ responsePrefix: e.target.value })}
              placeholder="🤖 Fred: "
            />
          </div>

          <div className="config-group">
            <label>AI Model</label>
            <select
              value={config.aiModel}
              onChange={(e) => updateConfig({ aiModel: e.target.value })}
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
              <option value="gpt-4o">GPT-4o (Best Quality)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div className="config-group">
            <label>System Prompt</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              rows={5}
              placeholder="You are Fred, a helpful AI assistant..."
            />
            <small>Instructions for how Fred should respond</small>
          </div>

          <div className="config-group">
            <label>Max Response Length</label>
            <input
              type="number"
              value={config.maxResponseLength}
              onChange={(e) => updateConfig({ maxResponseLength: parseInt(e.target.value) })}
              min={100}
              max={2000}
            />
          </div>
        </div>
      ) : (
        <div className="loading">Loading configuration...</div>
      )}
    </div>
  );

  // Render setup tab
  const renderSetup = () => (
    <div className="setup-panel">
      <h3>Setup Guide</h3>
      
      <div className="setup-section">
        <h4>1. Facebook App Setup</h4>
        <ol>
          <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
          <li>Create a new app (Business type)</li>
          <li>Add the "Messenger" product</li>
          <li>Generate a Page Access Token</li>
          <li>Configure the webhook:
            <ul>
              <li><strong>Callback URL:</strong> <code>{API_URL}/webhook</code></li>
              <li><strong>Verify Token:</strong> <code>FRED_VERIFY_TOKEN_12345</code></li>
              <li><strong>Subscriptions:</strong> messages, messaging_postbacks</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="setup-section">
        <h4>2. Worker Secrets</h4>
        <p>Set these secrets using Wrangler CLI:</p>
        <pre>{`wrangler secret put FB_PAGE_ACCESS_TOKEN
wrangler secret put FB_APP_SECRET  
wrangler secret put OPENAI_API_KEY`}</pre>
      </div>

      <div className="setup-section">
        <h4>3. Dashboard API Key</h4>
        <p>Set an API key to secure this dashboard:</p>
        <div className="api-key-form">
          <input
            type="text"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter new API key"
          />
          <button onClick={setupApiKey}>Set API Key</button>
        </div>
      </div>

      <div className="setup-section">
        <h4>4. Enter Your API Key</h4>
        <div className="api-key-form">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <button onClick={saveApiKey}>Save</button>
        </div>
      </div>

      <div className="setup-section">
        <h4>Test Connection</h4>
        <button 
          onClick={async () => {
            const result = await apiCall('test');
            if (result) {
              alert('Connection successful!\n\n' + JSON.stringify(result, null, 2));
            }
          }}
          className="test-btn"
        >
          Test Worker Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            <h1>Fred Messenger</h1>
          </div>
          <div className="header-status">
            <span className={`connection-badge ${status}`}>
              {status === 'connected' ? '● Connected' : status === 'loading' ? '○ Loading...' : '● Offline'}
            </span>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 Messages
        </button>
        <button 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Config
        </button>
        <button 
          className={`tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          🔧 Setup
        </button>
      </nav>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'config' && renderConfig()}
        {activeTab === 'setup' && renderSetup()}
      </main>

      <footer className="App-footer">
        <p>Fred Messenger v2.0 | Worker: {API_URL}</p>
      </footer>
    </div>
  );
}

export default App;
