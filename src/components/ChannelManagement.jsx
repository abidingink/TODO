import React, { useState, useEffect } from 'react';

const ChannelManagement = ({ api }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannel, setNewChannel] = useState({
    type: 'whatsapp',
    name: '',
    config: {}
  });

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const channelData = await api.getChannels();
        setChannels(channelData);
        setError(null);
      } catch (err) {
        console.error('Failed to load channels:', err);
        setError('Failed to load channels');
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadChannels, 30000);
    return () => clearInterval(interval);
  }, [api]);

  const handleAddChannel = async () => {
    try {
      await api.addChannel(newChannel);
      setNewChannel({ type: 'whatsapp', name: '', config: {} });
      setShowAddForm(false);
      // Refresh channels
      const updatedChannels = await api.getChannels();
      setChannels(updatedChannels);
    } catch (err) {
      console.error('Failed to add channel:', err);
      setError('Failed to add channel');
    }
  };

  const handleRemoveChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to remove this channel?')) {
      return;
    }
    
    try {
      await api.removeChannel(channelId);
      // Refresh channels
      const updatedChannels = await api.getChannels();
      setChannels(updatedChannels);
    } catch (err) {
      console.error('Failed to remove channel:', err);
      setError('Failed to remove channel');
    }
  };

  const handleToggleChannel = async (channelId, enabled) => {
    try {
      await api.updateChannel(channelId, { enabled });
      // Refresh channels
      const updatedChannels = await api.getChannels();
      setChannels(updatedChannels);
    } catch (err) {
      console.error('Failed to update channel:', err);
      setError('Failed to update channel');
    }
  };

  const getChannelIcon = (type) => {
    const icons = {
      whatsapp: '📱',
      telegram: '✈️',
      discord: '🎮',
      imessage: '💬',
      signal: '🛡️',
      slack: '📎',
      googlechat: '💬',
      webchat: '🌐'
    };
    return icons[type] || '🔌';
  };

  const getChannelStatus = (channel) => {
    if (!channel.enabled) return 'disabled';
    if (channel.connected) return 'connected';
    if (channel.connecting) return 'connecting';
    return 'disconnected';
  };

  const renderChannelConfig = (channel) => {
    const config = channel.config || {};
    const displayFields = [];
    
    if (config.phoneNumber) displayFields.push(`Phone: ${config.phoneNumber}`);
    if (config.botToken) displayFields.push(`Bot Token: ${config.botToken.substring(0, 8)}...`);
    if (config.webhookUrl) displayFields.push(`Webhook: ${config.webhookUrl}`);
    if (config.allowedFrom) displayFields.push(`Allowed From: ${Array.isArray(config.allowedFrom) ? config.allowedFrom.join(', ') : config.allowedFrom}`);
    
    return displayFields.length > 0 ? (
      <div className="channel-config">
        {displayFields.map((field, index) => (
          <span key={index} className="config-item">{field}</span>
        ))}
      </div>
    ) : null;
  };

  if (loading) {
    return <div className="loading">Loading channels...</div>;
  }

  return (
    <div className="channel-management">
      <div className="section-header">
        <h2>Channel Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '➕ Add Channel'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showAddForm && (
        <div className="add-channel-form">
          <h3>Add New Channel</h3>
          <div className="form-group">
            <label>Channel Type</label>
            <select
              value={newChannel.type}
              onChange={(e) => setNewChannel({...newChannel, type: e.target.value})}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
              <option value="imessage">iMessage</option>
              <option value="signal">Signal</option>
              <option value="slack">Slack</option>
              <option value="googlechat">Google Chat</option>
              <option value="webchat">Web Chat</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Channel Name</label>
            <input
              type="text"
              value={newChannel.name}
              onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
              placeholder="Enter channel name"
            />
          </div>

          {/* Channel-specific configuration */}
          {newChannel.type === 'whatsapp' && (
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={newChannel.config?.phoneNumber || ''}
                onChange={(e) => setNewChannel({
                  ...newChannel,
                  config: {...newChannel.config, phoneNumber: e.target.value}
                })}
                placeholder="+1234567890"
              />
            </div>
          )}

          {newChannel.type === 'telegram' && (
            <div className="form-group">
              <label>Bot Token</label>
              <input
                type="password"
                value={newChannel.config?.botToken || ''}
                onChange={(e) => setNewChannel({
                  ...newChannel,
                  config: {...newChannel.config, botToken: e.target.value}
                })}
                placeholder="Your Telegram bot token"
              />
            </div>
          )}

          <div className="form-actions">
            <button onClick={handleAddChannel} className="primary-btn">
              Add Channel
            </button>
            <button onClick={() => setShowAddForm(false)} className="secondary-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="channels-grid">
        {channels.length === 0 ? (
          <div className="empty-state">
            <p>No channels configured yet.</p>
            <p>Click "Add Channel" to connect your first messaging platform.</p>
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="channel-card">
              <div className="channel-header">
                <div className="channel-icon">
                  {getChannelIcon(channel.type)}
                </div>
                <div className="channel-info">
                  <h3>{channel.name || channel.type}</h3>
                  <div className={`channel-status ${getChannelStatus(channel)}`}>
                    {getChannelStatus(channel).replace('_', ' ')}
                  </div>
                </div>
                <div className="channel-actions">
                  <button
                    onClick={() => handleToggleChannel(channel.id, !channel.enabled)}
                    className={`toggle-btn ${channel.enabled ? 'enabled' : 'disabled'}`}
                  >
                    {channel.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleRemoveChannel(channel.id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              {renderChannelConfig(channel)}
              
              <div className="channel-stats">
                <div className="stat-item">
                  <span className="stat-label">Messages Today</span>
                  <span className="stat-value">{channel.stats?.today?.messages || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Sessions</span>
                  <span className="stat-value">{channel.stats?.activeSessions || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChannelManagement;