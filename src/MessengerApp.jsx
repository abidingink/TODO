import React, { useState, useEffect } from 'react';
import './MessengerApp.css';

function MessengerApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messengerUrl, setMessengerUrl] = useState('https://messenger.com');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [status, setStatus] = useState('Ready to connect');

  // Check if we're already logged in (simplified check)
  useEffect(() => {
    // In a real implementation, this would check for Facebook session cookies
    // For now, we'll use localStorage as a simple indicator
    const savedLogin = localStorage.getItem('fbMessengerLoggedIn');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      setStatus('Connected to Facebook Messenger');
    }
  }, []);

  const handleLogin = () => {
    // Open Messenger in a new tab/window for login
    window.open(messengerUrl, '_blank');
    setStatus('Please log in to Facebook Messenger in the new tab');
    
    // Set a timeout to check if login was successful
    setTimeout(() => {
      // In a real implementation, we'd have a more sophisticated way to detect login
      // For now, we'll assume the user logged in successfully
      localStorage.setItem('fbMessengerLoggedIn', 'true');
      setIsLoggedIn(true);
      setStatus('Connected to Facebook Messenger');
    }, 10000);
  };

  const handleLogout = () => {
    localStorage.removeItem('fbMessengerLoggedIn');
    setIsLoggedIn(false);
    setStatus('Disconnected from Facebook Messenger');
  };

  const toggleAutoReply = () => {
    setAutoReplyEnabled(!autoReplyEnabled);
    setStatus(autoReplyEnabled ? 'Auto-reply disabled' : 'Auto-reply enabled');
  };

  return (
    <div className="messenger-app">
      <header className="app-header">
        <h1>🤖 Fred Messenger</h1>
        <p>Facebook Messenger Integration</p>
      </header>

      <main className="app-main">
        {!isLoggedIn ? (
          <div className="login-section">
            <div className="login-card">
              <h2>Connect to Facebook Messenger</h2>
              <p>Sign in with your Facebook account to start using Fred through Messenger.</p>
              
              <button 
                onClick={handleLogin}
                className="login-btn"
              >
                🔑 Sign in with Facebook
              </button>
              
              <div className="login-info">
                <p><strong>How it works:</strong></p>
                <ul>
                  <li>Click "Sign in with Facebook" above</li>
                  <li>Complete Facebook login in the new tab</li>
                  <li>Return here and you'll be connected!</li>
                  <li>Fred will monitor your Messenger conversations</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="connected-section">
            <div className="status-card">
              <div className="status-indicator connected">
                <span>🟢</span> Connected to Facebook Messenger
              </div>
              
              <div className="controls">
                <button 
                  onClick={toggleAutoReply}
                  className={`toggle-btn ${autoReplyEnabled ? 'enabled' : ''}`}
                >
                  {autoReplyEnabled ? '✅ Auto-Reply ON' : '❌ Auto-Reply OFF'}
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  🔐 Disconnect
                </button>
              </div>
              
              <div className="features">
                <h3>Features</h3>
                <ul>
                  <li>💬 Real-time message monitoring</li>
                  <li>🤖 AI-powered responses as Fred</li>
                  <li>👥 Group chat support</li>
                  <li>🔄 Shared identity (human + bot assistance)</li>
                  <li>🔒 Secure browser-based authentication</li>
                </ul>
              </div>
            </div>
            
            <div className="instructions">
              <h3>Getting Started</h3>
              <ol>
                <li>Open Facebook Messenger in your browser</li>
                <li>Start a conversation with anyone</li>
                <li>Fred will automatically monitor messages</li>
                <li>Toggle auto-reply to control when Fred responds</li>
                <li>Use the shared identity for seamless collaboration</li>
              </ol>
            </div>
          </div>
        )}
        
        <div className="status-bar">
          <span>Status: {status}</span>
        </div>
      </main>
    </div>
  );
}

export default MessengerApp;