# 🤖 AI Agent Dashboard

A comprehensive dashboard for managing your AI agents, channels, skills, and external accounts. Built on Moltbot/OpenClaw architecture.

## Features

- **Agent Management**: View and configure multiple AI agents
- **Channel Management**: Connect/disconnect messaging platforms (WhatsApp, Telegram, Discord, etc.)
- **Job & Skill Management**: Schedule cron jobs and manage agent skills
- **Account Integration**: Securely store and manage external account credentials
- **Real-time Chat**: Direct chat interface with your AI agents
- **System Monitoring**: View logs, status, and performance metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Dashboard (React)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Web Interface                               │   │
│  │  • Agent Management                                     │   │
│  │  • Channel Configuration                                │   │
│  │  • Job/Skill Management                                 │   │
│  │  • Account Credentials                                  │   │
│  │  • Live Chat Interface                                  │   │
│  │  • System Monitoring                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              │ HTTP API
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Local API Server                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Proxy Layer                                 │   │
│  │  • Routes requests to Moltbot Gateway                   │   │
│  │  • Handles secure credential storage                     │   │
│  │  • Provides local development convenience                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              │ WebSocket/HTTP
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Moltbot Gateway                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Core AI Agent Platform                      │   │
│  │  • Manages agent sessions                               │   │
│  │  │  • Handles channel connections                       │   │
│  │  • Executes cron jobs and skills                        │   │
│  │  • Provides secure credential management                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start both API server and React dashboard
npm run dev

# Or run separately:
npm run dev:api      # Local API server (port 8787)
npm run dev:client   # React dashboard (port 5173)

# Access the dashboard at http://localhost:5173
```

### Build for Production

```bash
npm run build
```

## Deployment Options

### Local Network Access
The dashboard is designed to run locally alongside your Moltbot Gateway. For network access:

1. **Tailscale**: Connect via Tailscale for secure remote access
2. **Local Network**: Access via your machine's local IP address
3. **SSH Tunnel**: Create an SSH tunnel for remote access

### Cloudflare Pages (Advanced)
You can deploy the static frontend to Cloudflare Pages, but you'll need to:
- Configure `VITE_MOLTBOT_GATEWAY_URL` to point to your Moltbot instance
- Ensure your Moltbot Gateway is accessible from the internet
- Handle CORS and security appropriately

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MOLTBOT_GATEWAY_URL` | `http://localhost:18789` | URL of your Moltbot Gateway |
| `VITE_API_PORT` | `8787` | Port for local API server |
| `ACCOUNTS_STORAGE_PATH` | `./data/accounts.json` | Path for secure credential storage |

### Security

- **Credential Storage**: External account credentials are stored locally in encrypted format
- **API Authentication**: The dashboard uses Moltbot's built-in authentication
- **Local Only**: By default, the dashboard only connects to local Moltbot instances for security

## Project Structure

```
ai-agent-dashboard/
├── dist/                    # Production build output
├── data/                    # Secure credential storage
│   └── accounts.json        # Encrypted account credentials
├── public/                  # Static assets
├── scripts/
│   └── local-api-server.js  # Local development API proxy
├── src/
│   ├── components/          # Dashboard components
│   │   ├── AccountManagement.jsx
│   │   ├── AgentManagement.jsx
│   │   ├── ChannelManagement.jsx
│   │   ├── ChatInterface.jsx
│   │   ├── JobManagement.jsx
│   │   └── SystemMonitoring.jsx
│   ├── services/
│   │   └── moltbotApi.js    # Moltbot Gateway API integration
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.jsx             # Entry point
├── _headers                 # Cloudflare Pages security headers
├── _redirects               # SPA routing for Pages
├── index.html               # HTML template
├── package.json
├── vite.config.js
├── README.md
└── DEPLOYMENT.md
```

## Usage

1. **Start Moltbot Gateway** (if not already running)
2. **Start the dashboard**: `npm run dev`
3. **Open browser**: Navigate to `http://localhost:5173`
4. **Configure channels**: Connect your messaging platforms
5. **Manage agents**: View and configure your AI agents
6. **Set up jobs**: Schedule automation tasks
7. **Add accounts**: Securely store external service credentials
8. **Chat directly**: Use the built-in chat interface

## Security Considerations

1. **Local Storage**: Account credentials are stored locally and encrypted
2. **Network Access**: By default, only connects to localhost for security
3. **Authentication**: Uses Moltbot's existing auth system
4. **CORS**: Proper CORS headers prevent unauthorized access
5. **HTTPS**: Always use HTTPS in production environments

## Troubleshooting

### Blank Screen
- Ensure Moltbot Gateway is running on port 18789
- Check browser console for connection errors
- Verify local API server is running on port 8787

### Connection Issues
- Confirm Moltbot Gateway URL is correct
- Check firewall settings if accessing over network
- Verify authentication tokens are valid

### Missing Features
- Ensure you're running the latest version of Moltbot
- Check that required channels are properly configured
- Verify agent permissions and capabilities

## Development

- **Hot Reload**: Both frontend and API server support hot reloading
- **API Mocking**: Easy to mock Moltbot APIs for offline development
- **Component Library**: Reusable components for consistent UI
- **Type Safety**: TypeScript-ready structure (can be added easily)

## License

MIT