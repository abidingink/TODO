import React, { useState, useEffect, useCallback } from 'react';

const SystemMonitoring = ({ moltbotApi }) => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch system status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const status = await moltbotApi.getSystemStatus();
      setSystemStatus(status);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
      setError('Failed to fetch system status');
    }
  }, [moltbotApi]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const logData = await moltbotApi.getLogs();
      setLogs(logData || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      // Don't set error for logs as they might not be available
    }
  }, [moltbotApi]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSystemStatus(),
        fetchLogs()
      ]);
      setLoading(false);
    };

    loadData();

    // Set up auto-refresh if enabled
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchSystemStatus();
        fetchLogs();
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchSystemStatus, fetchLogs, autoRefresh, refreshInterval]);

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (uptimeMs) => {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get status indicator color
  const getStatusColor = (status) => {
    if (status === 'running' || status === 'healthy') return 'green';
    if (status === 'warning' || status === 'degraded') return 'yellow';
    if (status === 'error' || status === 'stopped') return 'red';
    return 'gray';
  };

  if (loading && !systemStatus) {
    return (
      <div className="system-monitoring">
        <h2>System Monitoring</h2>
        <div className="loading">Loading system status...</div>
      </div>
    );
  }

  return (
    <div className="system-monitoring">
      <div className="monitoring-header">
        <h2>System Monitoring</h2>
        <div className="monitoring-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </select>
          )}
          <button onClick={() => {
            fetchSystemStatus();
            fetchLogs();
          }}>
            Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {systemStatus && (
        <div className="system-status-grid">
          {/* Gateway Status */}
          <div className="status-card">
            <div className="status-header">
              <span className={`status-indicator ${getStatusColor(systemStatus.gateway?.status)}`}></span>
              <h3>Gateway</h3>
            </div>
            <div className="status-details">
              <div className="detail-row">
                <span>Status:</span>
                <span>{systemStatus.gateway?.status || 'Unknown'}</span>
              </div>
              {systemStatus.gateway?.uptime && (
                <div className="detail-row">
                  <span>Uptime:</span>
                  <span>{formatUptime(systemStatus.gateway.uptime)}</span>
                </div>
              )}
              {systemStatus.gateway?.version && (
                <div className="detail-row">
                  <span>Version:</span>
                  <span>{systemStatus.gateway.version}</span>
                </div>
              )}
            </div>
          </div>

          {/* Memory Usage */}
          {systemStatus.memory && (
            <div className="status-card">
              <div className="status-header">
                <span className={`status-indicator ${systemStatus.memory.usage > 80 ? 'red' : systemStatus.memory.usage > 60 ? 'yellow' : 'green'}`}></span>
                <h3>Memory</h3>
              </div>
              <div className="status-details">
                <div className="detail-row">
                  <span>Usage:</span>
                  <span>{systemStatus.memory.usage}%</span>
                </div>
                <div className="detail-row">
                  <span>Used:</span>
                  <span>{formatBytes(systemStatus.memory.used)}</span>
                </div>
                <div className="detail-row">
                  <span>Total:</span>
                  <span>{formatBytes(systemStatus.memory.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* CPU Usage */}
          {systemStatus.cpu && (
            <div className="status-card">
              <div className="status-header">
                <span className={`status-indicator ${systemStatus.cpu.usage > 80 ? 'red' : systemStatus.cpu.usage > 60 ? 'yellow' : 'green'}`}></span>
                <h3>CPU</h3>
              </div>
              <div className="status-details">
                <div className="detail-row">
                  <span>Usage:</span>
                  <span>{systemStatus.cpu.usage}%</span>
                </div>
                <div className="detail-row">
                  <span>Cores:</span>
                  <span>{systemStatus.cpu.cores}</span>
                </div>
              </div>
            </div>
          )}

          {/* Disk Usage */}
          {systemStatus.disk && (
            <div className="status-card">
              <div className="status-header">
                <span className={`status-indicator ${systemStatus.disk.usage > 80 ? 'red' : systemStatus.disk.usage > 60 ? 'yellow' : 'green'}`}></span>
                <h3>Disk</h3>
              </div>
              <div className="status-details">
                <div className="detail-row">
                  <span>Usage:</span>
                  <span>{systemStatus.disk.usage}%</span>
                </div>
                <div className="detail-row">
                  <span>Used:</span>
                  <span>{formatBytes(systemStatus.disk.used)}</span>
                </div>
                <div className="detail-row">
                  <span>Total:</span>
                  <span>{formatBytes(systemStatus.disk.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          {systemStatus.sessions && (
            <div className="status-card">
              <div className="status-header">
                <span className={`status-indicator ${systemStatus.sessions.active > 10 ? 'yellow' : 'green'}`}></span>
                <h3>Sessions</h3>
              </div>
              <div className="status-details">
                <div className="detail-row">
                  <span>Active:</span>
                  <span>{systemStatus.sessions.active}</span>
                </div>
                <div className="detail-row">
                  <span>Total:</span>
                  <span>{systemStatus.sessions.total}</span>
                </div>
                {systemStatus.sessions.recent && (
                  <div className="detail-row">
                    <span>Recent:</span>
                    <span>{systemStatus.sessions.recent}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Channels */}
          {systemStatus.channels && (
            <div className="status-card">
              <div className="status-header">
                <span className={`status-indicator ${Object.values(systemStatus.channels).some(c => c.status !== 'connected') ? 'yellow' : 'green'}`}></span>
                <h3>Channels</h3>
              </div>
              <div className="status-details">
                {Object.entries(systemStatus.channels).map(([channel, info]) => (
                  <div key={channel} className="detail-row">
                    <span>{channel}:</span>
                    <span className={`channel-status ${getStatusColor(info.status)}`}>
                      {info.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Section */}
      <div className="logs-section">
        <h3>Recent Logs</h3>
        {logs.length > 0 ? (
          <div className="logs-container">
            {logs.slice(-50).reverse().map((log, index) => (
              <div key={index} className={`log-entry log-level-${log.level?.toLowerCase() || 'info'}`}>
                <div className="log-timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-level">
                  {log.level || 'INFO'}
                </div>
                <div className="log-message">
                  {log.message}
                </div>
                {log.details && (
                  <div className="log-details">
                    {JSON.stringify(log.details, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No logs available
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {systemStatus?.metrics && (
        <div className="metrics-section">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            {Object.entries(systemStatus.metrics).map(([metric, value]) => (
              <div key={metric} className="metric-card">
                <div className="metric-name">{metric.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="metric-value">{typeof value === 'number' ? value.toFixed(2) : value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;