# 🤖 AI Agent Dashboard

A comprehensive dashboard for managing multiple AI agents, channels, skills, and external accounts. Built on Moltbot Gateway with real-time monitoring and control.

## Features

### 🧠 Agent Management
- View and manage multiple AI agents
- Configure agent settings and capabilities
- Monitor agent performance and activity
- Switch between different agents seamlessly

### 📱 Channel Management  
- Connect/disconnect messaging platforms (WhatsApp, Telegram, Discord, iMessage, etc.)
- Configure channel-specific settings and permissions
- View channel status and connection health
- Manage group chat settings and mention rules

### 🔧 Skills & Jobs Management
- Install, update, and remove agent skills
- Manage cron jobs and scheduled tasks
- View job history and execution logs
- Create new automation workflows

### 🔐 Account Integration
- Securely store external account credentials (email, social media, APIs)
- Manage which agents have access to which accounts
- View account connection status and permissions
- Audit trail of account usage

### 💬 Chat Interface
- Direct real-time chat with your primary AI agent
- View conversation history and context
- Send commands and receive responses instantly
- Multi-agent chat switching

### 📊 System Monitoring
- Real-time system status and health metrics
- Resource usage monitoring (CPU, memory, network)
- Log viewing and filtering
- Performance analytics and insights

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Dashboard                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Frontend                             │   │
│  │  • Agent Management                                     │   │
│  │  • Channel Configuration                                │   │
│  │  • Skills & Jobs                                        │   │
│  │  │  • Account Integration                               │   │
│  │  • Real-time Chat                                       │   │
│  │  • System Monitoring                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              │ WebSocket/API
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Moltbot Gateway                              │
│  ┌──────────┐    Session Management    ┌──────────────────────┐ │
│  │ Channels │◄────────────────────────►│      Agents          │ │
│  └──────────┘    Message Routing       └──────────────────────┘ │
│        ▲                                   ▲                   │
│        │                                   │                   │
│  ┌──────────┐    External Services    ┌──────────────────────┐ │
│  │ Accounts │◄────────────────────────►│      Skills          │ │
│  └──────────┘    Job Scheduling       └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or run separately:
npm run dev:api      # Local API proxy (port 8787)
npm run dev:client   # React dashboard (port 5173)
```

### Build for Production

```bash
npm run build
```

## Deployment

### Cloudflare Pages (Recommended)

1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your Git repository
4. Settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (or `/fb-messenger-project` if in monorepo)

### Direct Integration with Moltbot

The dashboard automatically connects to your local Moltbot Gateway at:
- **Default**: `http://localhost:18789`
- **Custom**: Set `VITE_MOLTBOT_URL` environment variable

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MOLTBOT_URL` | `http://localhost:18789` | Moltbot Gateway URL |
| `VITE_API_KEY` | (auto-generated) | Dashboard API key for security |

### Security

- The dashboard uses Moltbot's built-in authentication
- All credential storage is encrypted and secure
- API keys are required for dashboard access
- HTTPS is enforced in production

## Project Structure

```
ai-agent-dashboard/
├── dist/                    # Production build output
├── public/                  # Static assets
├── scripts/
│   ├── local-api-proxy.js   # Local development API proxy
│   └── setup.js            # Initial setup script
├── src/
│   ├── components/         # React components
│   │   ├── agents/         # Agent management components
│   │   ├── channels/       # Channel management components  
│   │   ├── skills/         # Skills and jobs components
│   │   ├── accounts/       # Account integration components
│   │   ├── chat/           # Chat interface components
│   │   └── monitoring/     # System monitoring components
│   ├── App.jsx             # Main application component
│   ├── App.css             # Application styles
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── _headers                # Cloudflare Pages headers
├── _redirects              # SPA routing for Pages
├── index.html              # HTML template
├── package.json
├── vite.config.js
└── README.md
```

## API Integration

The dashboard communicates with Moltbot Gateway using:

- **WebSocket**: Real-time communication and chat
- **REST API**: Configuration and management operations
- **Event Stream**: Real-time updates and notifications

All API endpoints are documented in the [Moltbot API documentation](https://docs.molt.bot).

## Development Notes

- The local API proxy (`scripts/local-api-proxy.js`) forwards requests to Moltbot Gateway
- Use browser developer tools to debug WebSocket connections
- The dashboard automatically detects Moltbot Gateway status
- All sensitive operations require authentication

## License

MIT