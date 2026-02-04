// Moltbot Gateway API Service
// This service handles communication with the Moltbot Gateway

import { toast } from 'react-hot-toast';

// Get the Moltbot Gateway URL
const getGatewayUrl = () => {
  // In development, use local gateway
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:18789';
  }
  // In production, try to detect the gateway URL
  // This will be configured via environment variables or auto-detected
  return window.MOLTBOT_GATEWAY_URL || 'http://localhost:18789';
};

const GATEWAY_URL = getGatewayUrl();

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${GATEWAY_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    toast.error(`API Error: ${error.message}`);
    throw error;
  }
};

// Agent Management
export const getAgents = async () => {
  // This will be implemented based on Moltbot's agent management API
  return await apiCall('/api/agents');
};

export const getAgentStatus = async (agentId) => {
  return await apiCall(`/api/agents/${agentId}/status`);
};

// Channel Management
export const getChannels = async () => {
  return await apiCall('/api/channels');
};

export const connectChannel = async (channelType, config) => {
  return await apiCall('/api/channels/connect', {
    method: 'POST',
    body: JSON.stringify({ type: channelType, config }),
  });
};

export const disconnectChannel = async (channelId) => {
  return await apiCall(`/api/channels/${channelId}/disconnect`, {
    method: 'POST',
  });
};

// Job Management
export const getCronJobs = async () => {
  return await apiCall('/api/cron/jobs');
};

export const createCronJob = async (jobConfig) => {
  return await apiCall('/api/cron/jobs', {
    method: 'POST',
    body: JSON.stringify(jobConfig),
  });
};

export const updateCronJob = async (jobId, jobConfig) => {
  return await apiCall(`/api/cron/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(jobConfig),
  });
};

export const deleteCronJob = async (jobId) => {
  return await apiCall(`/api/cron/jobs/${jobId}`, {
    method: 'DELETE',
  });
};

// Skills Management
export const getSkills = async () => {
  return await apiCall('/api/skills');
};

export const installSkill = async (skillName) => {
  return await apiCall('/api/skills/install', {
    method: 'POST',
    body: JSON.stringify({ name: skillName }),
  });
};

// Account Management
export const getAccounts = async () => {
  return await apiCall('/api/accounts');
};

export const addAccount = async (accountData) => {
  return await apiCall('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(accountData),
  });
};

export const removeAccount = async (accountId) => {
  return await apiCall(`/api/accounts/${accountId}`, {
    method: 'DELETE',
  });
};

// Chat Interface
export const sendMessage = async (message, sessionId = 'main') => {
  return await apiCall('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  });
};

export const getChatHistory = async (sessionId = 'main', limit = 50) => {
  return await apiCall(`/api/chat/history?sessionId=${sessionId}&limit=${limit}`);
};

// System Status
export const getSystemStatus = async () => {
  return await apiCall('/health');
};

export const getGatewayConfig = async () => {
  return await apiCall('/api/config');
};

export const updateGatewayConfig = async (config) => {
  return await apiCall('/api/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

// Real-time updates (WebSocket)
export const createWebSocketConnection = (onMessage, onError) => {
  try {
    const wsUrl = GATEWAY_URL.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    onError(error);
    return null;
  }
};

// Export the gateway URL for other components
export { GATEWAY_URL };