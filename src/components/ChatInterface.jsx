import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage, getChatHistory, getSessionStatus } from '../services/moltbotApi';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history and session info
  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Get chat history
        const history = await getChatHistory();
        if (history) {
          setMessages(history);
        }

        // Get session status
        const status = await getSessionStatus();
        if (status) {
          setSessionInfo(status);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        setError('Failed to load chat history');
      }
    };

    loadChatData();
    
    // Set up real-time message listening (if supported)
    const messageListener = (event) => {
      if (event.data?.type === 'new_message') {
        setMessages(prev => [...prev, event.data.message]);
      }
    };
    
    // This would be connected to WebSocket in production
    // window.addEventListener('message', messageListener);
    
    return () => {
      // window.removeEventListener('message', messageListener);
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      type: 'text'
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);
    setError(null);

    try {
      // Send message to Moltbot
      const response = await sendMessage(inputMessage);
      
      if (response?.message) {
        const botMessage = {
          id: response.id || Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
          type: 'text'
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('No response from agent');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: '❌ Message failed to send. Please try again.',
        timestamp: Date.now(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>AI Agent Chat</h3>
        {sessionInfo && (
          <div className="session-info">
            <span className={`status-indicator ${sessionInfo.status === 'active' ? 'online' : 'offline'}`}></span>
            <span>{sessionInfo.agentName || 'Agent'} • {sessionInfo.model}</span>
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="welcome-message">
              <h4>👋 Hello! I'm your AI assistant.</h4>
              <p>Ask me anything or give me a task to help you with!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={`message ${msg.role === 'user' ? 'user-message' : msg.role === 'system' ? 'system-message' : 'bot-message'}`}
            >
              <div className="message-content">
                {msg.role === 'user' && (
                  <div className="message-avatar">👤</div>
                )}
                {msg.role === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                {msg.role === 'system' && (
                  <div className="message-avatar">⚙️</div>
                )}
                <div className="message-text">
                  {msg.content}
                </div>
                <div className="message-timestamp">
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isSending}
          rows="1"
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={!inputMessage.trim() || isSending}
          className="send-button"
        >
          {isSending ? '📨' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;