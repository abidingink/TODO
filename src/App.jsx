import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Configuration - Point to Moltbot Gateway
const getApiUrl = () => {
  // In development, use local gateway
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:18789';
  }
  // In production, use the configured gateway URL
  return window.MOLTBOT_GATEWAY_URL || 'http://localhost:18789';
};

const API_URL = getApiUrl();

function App() {
  const [status, setStatus] = useState('loading');
  const [agents, setAgents] = useState([]);
  const [channels, setChannels] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('moltbot_auth_token') || '');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // API call helper for Moltbot Gateway
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid authentication token');
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
  }, [authToken]);

  // Load initial data from Moltbot Gateway
  useEffect(() => {
    const loadData = async () => {
      setError(null);
      
      // Check gateway health
      try {
        const health = await fetch(`${API_URL}/health`);
        if (!health.ok) {
          setStatus('offline');
          setError('Gateway is offline');
          return;
        }
      } catch (err) {
        setStatus('offline');
        setError('Cannot connect to gateway');
        return;
      }

      // Load agents
      const agentsData = await apiCall('/api/agents');
      if (agentsData) {
        setAgents(agentsData.agents);
      }

      // Load channels
      const channelsData = await apiCall('/api/channels');
      if (channelsData) {
        setChannels(channelsData.channels);
      }

      // Load jobs
      const jobsData = await apiCall('/api/jobs');
      if (jobsData) {
        setJobs(jobsData.jobs);
      }

      // Load accounts
      const accountsData = await apiCall('/api/accounts');
      if (accountsData) {
        setAccounts(accountsData.accounts);
      }

      setStatus('connected');
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [apiCall]);

  // Send chat message
  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;
    
    const message = newMessage.trim();
    setNewMessage('');
    
    // Add to local chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Send to agent
    try {
      const response = await apiCall('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      
      if (response) {
        const agentMessage = {
          id: Date.now().toString() + '-agent',
          role: 'assistant',
          content: response.message,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, agentMessage]);
      }
    } catch (err) {
      console.error('Chat message failed:', err);
      const errorMessage = {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: 'Failed to send message. Please try again.',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Save auth token
  const saveAuthToken = () => {
    localStorage.setItem('moltbot_auth_token', authToken);
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
          <div className="stat-icon">🤖</div>
          <div className="stat-info">
            <div className="stat-value">{agents.length}</div>
            <div className="stat-label">Active Agents</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-value">{channels.length}</div>
            <div className="stat-label">Connected Channels</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <div className="stat-value">{jobs.filter(j => j.enabled).length}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-info">
            <div className="stat-value">{accounts.length}</div>
            <div className="stat-label">Linked Accounts</div>
          </div>
        </div>
      </div>

      <div className="status-panel">
        <h3>System Status</h3>
        <div className="status-items">
          <div className="status-item">
            <span className={`status-dot ${status === 'connected' ? 'green' : 'red'}`}></span>
            <span>Gateway: {status === 'connected' ? 'Online' : 'Offline'}</span>
          </div>
          <div className="status-item">
            <span className="status-dot blue"></span>
            <span>Main Agent: {agents.find(a => a.id === 'main')?.status || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {chatMessages.slice(-5).map((msg, i) => (
            <div key={msg.id} className={`activity-item ${msg.role === 'assistant' ? 'from-agent' : msg.role === 'user' ? 'from-user' : 'system'}`}>
              <div className="activity-icon">
                {msg.role === 'assistant' ? '🤖' : msg.role === 'user' ? '👤' : '⚙️'}
              </div>
              <div className="activity-content">
                <div className="activity-text">{msg.content.substring(0, 100)}...</div>
                <div className="activity-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          {chatMessages.length === 0 && (
            <div className="empty-state">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );

  // Render agents tab
  const renderAgents = () => (
    <div className="agents-panel">
      <h3>AI Agents</h3>
      <div className="agents-list">
        {agents.map((agent) => (
          <div key={agent.id} className="agent-card">
            <div className="agent-header">
              <div className="agent-name">
                <span className="agent-icon">🤖</span>
                <span>{agent.name || agent.id}</span>
              </div>
              <div className={`agent-status ${agent.status?.toLowerCase() || 'unknown'}`}>
                {agent.status || 'Unknown'}
              </div>
            </div>
            <div className="agent-details">
              <div className="agent-info">
                <strong>Model:</strong> {agent.model || 'Default'}
              </div>
              <div className="agent-info">
                <strong>Skills:</strong> {agent.skills?.length || 0}
              </div>
              <div className="agent-info">
                <strong>Created:</strong> {formatTime(agent.createdAt)}
              </div>
            </div>
            <div className="agent-actions">
              <button onClick={() => {/* Implement agent config */}}>Configure</button>
              <button onClick={() => {/* Implement restart */}}>Restart</button>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="empty-state">
            <p>No agents found.</p>
            <p>Your main agent should appear here once connected.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render channels tab
  const renderChannels = () => (
    <div className="channels-panel">
      <h3>Messaging Channels</h3>
      <div className="channels-list">
        {channels.map((channel) => (
          <div key={channel.id} className="channel-card">
            <div className="channel-header">
              <div className="channel-name">
                <span className="channel-icon">
                  {channel.type === 'whatsapp' ? '📱' : 
                   channel.type === 'telegram' ? '✈️' : 
                   channel.type === 'discord' ? '🎮' : 
                   channel.type === 'imessage' ? '💬' : '❓'}
                </span>
                <span>{channel.name || channel.type}</span>
              </div>
              <div className={`channel-status ${channel.connected ? 'connected' : 'disconnected'}`}>
                {channel.connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div className="channel-details">
              <div className="channel-info">
                <strong>Type:</strong> {channel.type}
              </div>
              <div className="channel-info">
                <strong>Account:</strong> {channel.accountId || 'Not set'}
              </div>
              <div className="channel-info">
                <strong>Last Active:</strong> {formatTime(channel.lastActive)}
              </div>
            </div>
            <div className="channel-actions">
              <button onClick={() => {/* Implement connect/disconnect */}}>
                {channel.connected ? 'Disconnect' : 'Connect'}
              </button>
              <button onClick={() => {/* Implement configure */}}>Configure</button>
            </div>
          </div>
        ))}
        {channels.length === 0 && (
          <div className="empty-state">
            <p>No channels connected.</p>
            <p>Connect WhatsApp, Telegram, Discord, or other messaging platforms.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render jobs tab
  const renderJobs = () => (
    <div className="jobs-panel">
      <h3>Automation Jobs</h3>
      <div className="jobs-list">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <div className="job-name">
                <span className="job-icon">⏰</span>
                <span>{job.name || job.id}</span>
              </div>
              <div className={`job-status ${job.enabled ? 'enabled' : 'disabled'}`}>
                {job.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className="job-details">
              <div className="job-info">
                <strong>Schedule:</strong> {job.schedule?.expr || job.schedule?.everyMs || 'One-time'}
              </div>
              <div className="job-info">
                <strong>Target:</strong> {job.sessionTarget}
              </div>
              <div className="job-info">
                <strong>Created:</strong> {formatTime(job.createdAt)}
              </div>
              <div className="job-info">
                <strong>Last Run:</strong> {job.lastRun ? formatTime(job.lastRun) : 'Never'}
              </div>
            </div>
            <div className="job-actions">
              <button onClick={() => {/* Implement toggle */}}>
                {job.enabled ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => {/* Implement edit */}}>Edit</button>
              <button onClick={() => {/* Implement delete */}} className="danger">Delete</button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="empty-state">
            <p>No automation jobs configured.</p>
            <p>Create scheduled tasks, reminders, or recurring actions.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render accounts tab
  const renderAccounts = () => (
    <div className="accounts-panel">
      <h3>Linked Accounts</h3>
      <div className="accounts-list">
        {accounts.map((account) => (
          <div key={account.id} className="account-card">
            <div className="account-header">
              <div className="account-name">
                <span className="account-icon">
                  {account.type === 'email' ? '📧' : 
                   account.type === 'social' ? '🌐' : 
                   account.type === 'storage' ? '💾' : '❓'}
                </span>
                <span>{account.name || account.username}</span>
              </div>
              <div className={`account-status ${account.verified ? 'verified' : 'unverified'}`}>
                {account.verified ? 'Verified' : 'Unverified'}
              </div>
            </div>
            <div className="account-details">
              <div className="account-info">
                <strong>Type:</strong> {account.type}
              </div>
              <div className="account-info">
                <strong>Username:</strong> {account.username}
              </div>
              <div className="account-info">
                <strong>Connected Apps:</strong> {account.connectedAgents?.join(', ') || 'None'}
              </div>
              <div className="account-info">
                <strong>Added:</strong> {formatTime(account.createdAt)}
              </div>
            </div>
            <div className="account-actions">
              <button onClick={() => {/* Implement test connection */}}>Test</button>
              <button onClick={() => {/* Implement edit */}}>Edit</button>
              <button onClick={() => {/* Implement remove */}} className="danger">Remove</button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="empty-state">
            <p>No accounts linked.</p>
            <p>Link email accounts, social media, cloud storage, and other services.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render chat tab
  const renderChat = () => (
    <div className="chat-panel">
      <h3>Chat with Your Agent</h3>
      <div className="chat-container">
        <div className="chat-messages">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Type your message..."
            disabled={!authToken}
          />
          <button onClick={sendChatMessage} disabled={!authToken || !newMessage.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );

  // Render setup tab
  const renderSetup = () => (
    <div className="setup-panel">
      <h3>Setup & Configuration</h3>
      
      <div className="setup-section">
        <h4>1. Gateway Connection</h4>
        <p>Connect to your Moltbot Gateway instance:</p>
        <div className="gateway-form">
          <input
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Enter your gateway authentication token"
          />
          <button onClick={saveAuthToken}>Save Token</button>
        </div>
        <p>Find your token in your Moltbot configuration file or generate a new one.</p>
      </div>

      <div className="setup-section">
        <h4>2. Connect Channels</h4>
        <p>Link your messaging platforms:</p>
        <div className="channel-setup">
          <button onClick={() => {/* Implement WhatsApp setup */}}>📱 WhatsApp</button>
          <button onClick={() => {/* Implement Telegram setup */}}>✈️ Telegram</button>
          <button onClick={() => {/* Implement Discord setup */}}>🎮 Discord</button>
          <button onClick={() => {/* Implement iMessage setup */}}>💬 iMessage</button>
        </div>
      </div>

      <div className="setup-section">
        <h4>3. Link Accounts</h4>
        <p>Connect external services securely:</p>
        <div className="account-setup">
          <button onClick={() => {/* Implement email setup */}}>📧 Email</button>
          <button onClick={() => {/* Implement social media setup */}}>🌐 Social Media</button>
          <button onClick={() => {/* Implement cloud storage setup */}}>💾 Cloud Storage</button>
        </div>
      </div>

      <div className="setup-section">
        <h4>4. Test Connection</h4>
        <button 
          onClick={async () => {
            const result = await apiCall('/health');
            if (result) {
              alert('Connection successful!\n\n' + JSON.stringify(result, null, 2));
            }
          }}
          className="test-btn"
        >
          Test Gateway Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <h1>AI Agent Dashboard</h1>
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
          className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          🤖 Agents
        </button>
        <button 
          className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          💬 Channels
        </button>
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          ⏰ Jobs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          🔑 Accounts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💭 Chat
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
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'channels' && renderChannels()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'accounts' && renderAccounts()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'setup' && renderSetup()}
      </main>

      <footer className="App-footer">
        <p>AI Agent Dashboard v1.0 | Gateway: {API_URL}</p>
      </footer>
    </div>
  );
}

export default App;