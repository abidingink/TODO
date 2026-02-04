import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const API_URL = `http://${window.location.hostname}:3001/api`;

function App() {
  // State
  const [status, setStatus] = useState({
    connected: false,
    loggedIn: false,
    loading: false,
    error: null,
    userName: null,
    loginStep: 'idle'
  });
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '', code: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [autoReply, setAutoReply] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        ws.send(JSON.stringify({ action: 'getStatus' }));
      };
      
      ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        
        switch (type) {
          case 'status':
            setStatus(data);
            break;
          case 'conversations':
            setConversations(data);
            break;
          case 'messages':
            if (data.threadId === selectedThread) {
              setMessages(data.messages);
            }
            break;
          case 'newMessage':
            console.log('New message:', data);
            break;
          case 'screenshot':
            setScreenshot(data.screenshot);
            break;
          case 'error':
            console.error('Server error:', data.message);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Reconnect after delay
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedThread]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // API calls
  const startLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login/start`, { method: 'POST' });
      const data = await res.json();
      if (data.screenshot) setScreenshot(data.screenshot);
    } catch (error) {
      console.error('Start login error:', error);
    }
  };

  const submitCredentials = async () => {
    try {
      const res = await fetch(`${API_URL}/login/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
      });
      const data = await res.json();
      if (data.screenshot) setScreenshot(data.screenshot);
    } catch (error) {
      console.error('Credentials error:', error);
    }
  };

  const submit2FA = async () => {
    try {
      const res = await fetch(`${API_URL}/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginForm.code })
      });
      const data = await res.json();
      if (data.screenshot) setScreenshot(data.screenshot);
    } catch (error) {
      console.error('2FA error:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST' });
      setSelectedThread(null);
      setMessages([]);
      setConversations([]);
      setScreenshot(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedThread) return;
    
    try {
      await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedThread, text: messageInput })
      });
      setMessageInput('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const selectConversation = async (threadId) => {
    setSelectedThread(threadId);
    try {
      await fetch(`${API_URL}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId })
      });
    } catch (error) {
      console.error('Navigate error:', error);
    }
  };

  const toggleAutoReply = async () => {
    const newState = !autoReply;
    setAutoReply(newState);
    try {
      await fetch(`${API_URL}/auto-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState })
      });
    } catch (error) {
      console.error('Toggle auto-reply error:', error);
    }
  };

  const refreshScreenshot = async () => {
    try {
      const res = await fetch(`${API_URL}/screenshot`);
      const data = await res.json();
      if (data.screenshot) setScreenshot(data.screenshot);
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  };

  // Render login form
  const renderLogin = () => (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>🤖 Fred Messenger</h2>
          <p>Sign in with your Facebook account</p>
        </div>

        {status.loginStep === 'idle' || status.loginStep === null ? (
          <button 
            className="start-btn"
            onClick={startLogin}
            disabled={status.loading}
          >
            {status.loading ? 'Starting...' : 'Start Login'}
          </button>
        ) : status.loginStep === 'credentials' ? (
          <div className="login-form">
            <input
              type="email"
              placeholder="Email or Phone"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className="login-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="login-input"
            />
            <button 
              className="submit-btn"
              onClick={submitCredentials}
              disabled={status.loading || !loginForm.email || !loginForm.password}
            >
              {status.loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        ) : status.loginStep === '2fa' ? (
          <div className="login-form">
            <p className="twofa-notice">Enter your 2FA verification code</p>
            <input
              type="text"
              placeholder="Verification Code"
              value={loginForm.code}
              onChange={(e) => setLoginForm({ ...loginForm, code: e.target.value })}
              className="login-input"
              autoComplete="one-time-code"
            />
            <button 
              className="submit-btn"
              onClick={submit2FA}
              disabled={status.loading || !loginForm.code}
            >
              {status.loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        ) : null}

        {status.error && (
          <div className="error-message">{status.error}</div>
        )}

        {screenshot && (
          <div className="screenshot-preview">
            <h4>Browser Preview</h4>
            <img src={screenshot} alt="Browser" />
            <button onClick={refreshScreenshot} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        )}

        <div className="security-note">
          <p>🔒 Your credentials are sent directly to Facebook.</p>
          <p>We use an embedded browser for secure authentication.</p>
        </div>
      </div>
    </div>
  );

  // Render main chat interface
  const renderChat = () => (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>💬 Chats</h2>
          <div className="user-info">
            <span className="user-name">{status.userName || 'User'}</span>
            <button onClick={logout} className="logout-btn" title="Logout">
              🚪
            </button>
          </div>
        </div>
        
        <div className="auto-reply-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoReply}
              onChange={toggleAutoReply}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">🤖 Fred Auto-Reply</span>
          </label>
        </div>

        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Loading conversations...</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedThread === conv.id ? 'selected' : ''} ${conv.unread ? 'unread' : ''}`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="conv-avatar">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.name} />
                  ) : (
                    <div className="avatar-placeholder">{conv.name[0]}</div>
                  )}
                </div>
                <div className="conv-info">
                  <span className="conv-name">{conv.name}</span>
                  <span className="conv-preview">{conv.preview}</span>
                </div>
                <span className="conv-time">{conv.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {selectedThread ? (
          <>
            <div className="chat-header">
              <h3>{conversations.find(c => c.id === selectedThread)?.name || 'Chat'}</h3>
              <button onClick={refreshScreenshot} className="view-btn" title="View browser">
                👁️
              </button>
            </div>

            <div className="messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sent ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.text}</p>
                    {msg.time && <span className="message-time">{msg.time}</span>}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input"
              />
              <button onClick={sendMessage} className="send-btn" disabled={!messageInput.trim()}>
                📤
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="placeholder-content">
              <span className="placeholder-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Screenshot modal */}
      {screenshot && (
        <div className="screenshot-modal" onClick={() => setScreenshot(null)}>
          <div className="screenshot-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setScreenshot(null)}>✕</button>
            <h3>Browser View</h3>
            <img src={screenshot} alt="Browser view" />
            <button onClick={refreshScreenshot} className="refresh-btn">🔄 Refresh</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🤖 Fred Messenger</h1>
          <span className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </header>
      
      <main className="main-content">
        {status.loggedIn ? renderChat() : renderLogin()}
      </main>
    </div>
  );
}

export default App;
