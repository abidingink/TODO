import React, { useState, useEffect, useCallback } from 'react';
import { useMoltbotApi } from '../services/moltbotApi';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    service: '',
    username: '',
    password: '',
    email: '',
    notes: '',
    enabled: true
  });
  const [editingAccount, setEditingAccount] = useState(null);

  const api = useMoltbotApi();

  // Load accounts from Moltbot
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/accounts');
      if (response.success) {
        setAccounts(response.accounts || []);
      } else {
        setError('Failed to load accounts');
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = async () => {
    try {
      const response = await api.post('/api/accounts', newAccount);
      if (response.success) {
        setAccounts([...accounts, response.account]);
        setNewAccount({ service: '', username: '', password: '', email: '', notes: '', enabled: true });
        setShowAddForm(false);
      } else {
        setError(response.error || 'Failed to add account');
      }
    } catch (err) {
      console.error('Error adding account:', err);
      setError('Failed to add account');
    }
  };

  const handleUpdateAccount = async () => {
    try {
      const response = await api.put(`/api/accounts/${editingAccount.id}`, editingAccount);
      if (response.success) {
        setAccounts(accounts.map(acc => acc.id === editingAccount.id ? response.account : acc));
        setEditingAccount(null);
      } else {
        setError(response.error || 'Failed to update account');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      setError('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account? This cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/accounts/${accountId}`);
      if (response.success) {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
      } else {
        setError(response.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
    }
  };

  const toggleAccountStatus = async (accountId, currentStatus) => {
    try {
      const response = await api.patch(`/api/accounts/${accountId}/status`, { 
        enabled: !currentStatus 
      });
      if (response.success) {
        setAccounts(accounts.map(acc => 
          acc.id === accountId ? { ...acc, enabled: !currentStatus } : acc
        ));
      } else {
        setError(response.error || 'Failed to update account status');
      }
    } catch (err) {
      console.error('Error toggling account status:', err);
      setError('Failed to update account status');
    }
  };

  const getServiceIcon = (service) => {
    const icons = {
      'gmail': '📧',
      'outlook': '📧',
      'whatsapp': '💬',
      'telegram': '📱',
      'discord': '🎮',
      'slack': '💬',
      'github': '🐙',
      'twitter': '🐦',
      'facebook': '📘',
      'instagram': '📸',
      'linkedin': '💼',
      'tiktok': '🎵',
      'youtube': '📺',
      'reddit': '🔺',
      'pinterest': '📌',
      'spotify': '🎵',
      'netflix': '🎬',
      'amazon': '📦',
      'ebay': '🛒',
      'paypal': '💰',
      'stripe': '💳',
      'shopify': '🏪',
      'wordpress': '📝',
      'other': '⚙️'
    };
    return icons[service.toLowerCase()] || icons.other;
  };

  const getServiceDisplayName = (service) => {
    const displayNames = {
      'gmail': 'Gmail',
      'outlook': 'Outlook',
      'whatsapp': 'WhatsApp',
      'telegram': 'Telegram',
      'discord': 'Discord',
      'slack': 'Slack',
      'github': 'GitHub',
      'twitter': 'Twitter/X',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'linkedin': 'LinkedIn',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'reddit': 'Reddit',
      'pinterest': 'Pinterest',
      'spotify': 'Spotify',
      'netflix': 'Netflix',
      'amazon': 'Amazon',
      'ebay': 'eBay',
      'paypal': 'PayPal',
      'stripe': 'Stripe',
      'shopify': 'Shopify',
      'wordpress': 'WordPress'
    };
    return displayNames[service.toLowerCase()] || service;
  };

  const getAccountStatusColor = (enabled) => {
    return enabled ? 'var(--success-color)' : 'var(--warning-color)';
  };

  const sortedAccounts = [...accounts].sort((a, b) => 
    a.service.localeCompare(b.service) || a.username.localeCompare(b.username)
  );

  return (
    <div className="account-management">
      <div className="header">
        <h2>Account Management</h2>
        <p>Manage your external service accounts and credentials securely.</p>
      </div>

      <div className="controls">
        <button 
          className="primary-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Account
        </button>
        
        {showAddForm && (
          <div className="add-account-form card">
            <h3>Add New Account</h3>
            <div className="form-group">
              <label>Service</label>
              <select
                value={newAccount.service}
                onChange={(e) => setNewAccount({...newAccount, service: e.target.value})}
                required
              >
                <option value="">Select a service...</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
                <option value="slack">Slack</option>
                <option value="github">GitHub</option>
                <option value="twitter">Twitter/X</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="reddit">Reddit</option>
                <option value="pinterest">Pinterest</option>
                <option value="spotify">Spotify</option>
                <option value="netflix">Netflix</option>
                <option value="amazon">Amazon</option>
                <option value="ebay">eBay</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="shopify">Shopify</option>
                <option value="wordpress">WordPress</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Username / Email</label>
              <input
                type="text"
                value={newAccount.username}
                onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                placeholder="Enter username or email"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                placeholder="Enter password"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email (if different)</label>
              <input
                type="email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                placeholder="Optional email address"
              />
            </div>
            
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newAccount.notes}
                onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                placeholder="Additional notes or information"
                rows="3"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAccount({ service: '', username: '', password: '', email: '', notes: '', enabled: true });
                }}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="primary-btn"
                onClick={handleAddAccount}
                disabled={!newAccount.service || !newAccount.username || !newAccount.password}
              >
                Add Account
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts configured yet.</p>
          <p>Click "Add Account" to connect your first service.</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {sortedAccounts.map(account => (
            <div key={account.id} className="account-card card">
              <div className="account-header">
                <div className="account-icon">
                  {getServiceIcon(account.service)}
                </div>
                <div className="account-info">
                  <h4>{getServiceDisplayName(account.service)}</h4>
                  <p className="account-username">{account.username}</p>
                </div>
                <div className="account-status">
                  <span 
                    className="status-indicator"
                    style={{ color: getAccountStatusColor(account.enabled) }}
                  >
                    ●
                  </span>
                  <span>{account.enabled ? 'Active' : 'Disabled'}</span>
                </div>
              </div>
              
              <div className="account-details">
                {account.email && account.email !== account.username && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{account.email}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {new Date(account.updatedAt).toLocaleString()}
                  </span>
                </div>
                
                {account.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{account.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="account-actions">
                <button
                  className="action-btn"
                  onClick={() => setEditingAccount(account)}
                >
                  Edit
                </button>
                <button
                  className={`action-btn ${account.enabled ? 'warning-btn' : 'success-btn'}`}
                  onClick={() => toggleAccountStatus(account.id, account.enabled)}
                >
                  {account.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="action-btn danger-btn"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingAccount && (
        <div className="edit-account-modal">
          <div className="modal-content card">
            <h3>Edit Account</h3>
            <div className="form-group">
              <label>Service</label>
              <select
                value={editingAccount.service}
                onChange={(e) => setEditingAccount({...editingAccount, service: e.target.value})}
                required
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
                <option value="slack">Slack</option>
                <option value="github">GitHub</option>
                <option value="twitter">Twitter/X</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="reddit">Reddit</option>
                <option value="pinterest">Pinterest</option>
                <option value="spotify">Spotify</option>
                <option value="netflix">Netflix</option>
                <option value="amazon">Amazon</option>
                <option value="ebay">eBay</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="shopify">Shopify</option>
                <option value="wordpress">WordPress</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Username / Email</label>
              <input
                type="text"
                value={editingAccount.username}
                onChange={(e) => setEditingAccount({...editingAccount, username: e.target.value})}
                placeholder="Enter username or email"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={editingAccount.password}
                onChange={(e) => setEditingAccount({...editingAccount, password: e.target.value})}
                placeholder="Enter password (leave blank to keep current)"
              />
            </div>
            
            <div className="form-group">
              <label>Email (if different)</label>
              <input
                type="email"
                value={editingAccount.email}
                onChange={(e) => setEditingAccount({...editingAccount, email: e.target.value})}
                placeholder="Optional email address"
              />
            </div>
            
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={editingAccount.notes}
                onChange={(e) => setEditingAccount({...editingAccount, notes: e.target.value})}
                placeholder="Additional notes or information"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={editingAccount.enabled}
                  onChange={(e) => setEditingAccount({...editingAccount, enabled: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{editingAccount.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            
            <div className="form-actions">
              <button 
                type="button"
                className="secondary-btn"
                onClick={() => setEditingAccount(null)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="primary-btn"
                onClick={handleUpdateAccount}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;