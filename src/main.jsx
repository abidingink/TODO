import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Set API URL from environment or default
window.FRED_API_URL = import.meta.env.VITE_WORKER_URL || 'https://fred-messenger-api.workers.dev';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
