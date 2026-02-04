import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Set Moltbot Gateway URL from environment or default
window.MOLTBOT_GATEWAY_URL = import.meta.env.VITE_MOLTBOT_GATEWAY_URL || 'http://localhost:18789';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)