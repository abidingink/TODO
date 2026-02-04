import React, { useState, useEffect } from 'react';
import { useMoltbotApi } from '../services/moltbotApi';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentConfig, setAgentConfig] = useState({});
  const api = useMoltbotApi();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      // Get current agent info
      const agentInfo = await api.getAgentInfo();
      setAgents([agentInfo]);
      setSelectedAgent(agentInfo.id);
      setAgentConfig(agentInfo.config || {});
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAgentConfig = async (updates) => {
    try {
      const updatedConfig = { ...agentConfig, ...updates };
      await api.updateAgentConfig(selectedAgent, updatedConfig);
      setAgentConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to update agent config:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading agents...</div>;
  }

  return (
    <div className="agent-management">
      <h2>AI Agents</h2>
      
      <div className="agents-list">
        {agents.map(agent => (
          <div 
            key={agent.id}
            className={`agent-card ${selectedAgent === agent.id ? 'selected' : ''}`}
            onClick={() => setSelectedAgent(agent.id)}
          >
            <div className="agent-header">
              <span className="agent-icon">{agent.icon || '🤖'}</span>
              <div className="agent-info">
                <h3>{agent.name || 'Main Agent'}</h3>
                <p className="agent-status">
                  Status: <span className={agent.status === 'active' ? 'status-active' : 'status-inactive'}>
                    {agent.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="agent-stats">
              <div className="stat-item">
                <span className="stat-label">Model</span>
                <span className="stat-value">{agent.model || 'qwen3-max'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sessions</span>
                <span className="stat-value">{agent.sessionCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div className="agent-config-panel">
          <h3>Agent Configuration</h3>
          <div className="config-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={agentConfig.name || ''}
                onChange={(e) => updateAgentConfig({ name: e.target.value })}
                placeholder="Agent name"
              />
            </div>
            
            <div className="form-group">
              <label>Model</label>
              <select
                value={agentConfig.model || 'qwen3-max'}
                onChange={(e) => updateAgentConfig({ model: e.target.value })}
              >
                <option value="qwen3-max">Qwen3 Max</option>
                <option value="alibaba-cloud-international/qwen3-max-2026-01-23">Qwen3 Max (Full)</option>
                <option value="anthropic/claude-opus-4-5">Claude Opus 4.5</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>

            <div className="form-group">
              <label>Voice</label>
              <select
                value={agentConfig.voice || 'default'}
                onChange={(e) => updateAgentConfig({ voice: e.target.value })}
              >
                <option value="default">Default</option>
                <option value="nova">Nova (Warm, British)</option>
                <option value="echo">Echo</option>
                <option value="onyx">Onyx</option>
              </select>
            </div>

            <div className="form-group">
              <label>Thinking Mode</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={agentConfig.thinking || false}
                  onChange={(e) => updateAgentConfig({ thinking: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </div>
              <small>Enable detailed reasoning and step-by-step responses</small>
            </div>

            <div className="form-group">
              <label>Verbose Mode</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={agentConfig.verbose || false}
                  onChange={(e) => updateAgentConfig({ verbose: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </div>
              <small>Show additional details and internal processes</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;