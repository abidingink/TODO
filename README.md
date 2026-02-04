# 🤖 Fred Messenger

A Facebook Messenger integration interface that allows you to manage your Facebook Messenger conversations with AI-assisted responses. Fred acts as your AI assistant, helping you monitor and respond to messages.

## Features

- **Secure Facebook Login**: Uses embedded browser automation with Puppeteer for standard Facebook authentication
- **Two-Factor Authentication Support**: Handles 2FA verification seamlessly
- **Real-time Message Monitoring**: WebSocket-based live updates for new messages
- **Conversation Management**: View and manage all your Messenger conversations
- **AI Auto-Reply**: Toggle Fred's automatic response feature (integrates with external AI)
- **Browser Preview**: See what the embedded browser is doing at any time
- **Session Persistence**: Remembers your login across restarts
- **Modern UI**: Clean, elegant interface inspired by Messenger's design

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Fred Messenger                          │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                      │
│  - Login UI with credential/2FA forms                       │
│  - Conversation sidebar                                     │
│  - Message view and input                                   │
│  - Real-time WebSocket updates                              │
├─────────────────────────────────────────────────────────────┤
│  Express Backend + WebSocket Server                         │
│  - REST API for actions                                     │
│  - WebSocket for real-time updates                          │
│  - Session management                                       │
├─────────────────────────────────────────────────────────────┤
│  Puppeteer Service                                          │
│  - Headless browser automation                              │
│  - Facebook Messenger web automation                        │
│  - Cookie-based session persistence                         │
│  - Stealth plugin for detection evasion                     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Facebook account (with Messenger enabled)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abidingink/TODO.git
   cd TODO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Usage

### Development Mode

Run both frontend and backend with hot-reload:

```bash
npm run dev
```

This starts:
- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:3001

### Production Mode

Build and run:

```bash
npm run build
npm start
```

Access at: http://localhost:3001

## How It Works

### Login Flow

1. Click "Start Login" to initialize the embedded browser
2. Enter your Facebook email/phone and password
3. If 2FA is enabled, enter your verification code
4. Once logged in, your session is saved for future use

### Messaging

1. Select a conversation from the sidebar
2. View message history
3. Type and send messages
4. Enable "Fred Auto-Reply" to have AI-assisted responses

### Security Notes

- **Credentials**: Your Facebook credentials are sent directly to Facebook through the embedded browser. They are never stored locally.
- **Session**: Login cookies are stored encrypted in `data/cookies.json`
- **Privacy**: All data stays on your machine. No external servers.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get current connection status |
| `/api/login/start` | POST | Initialize login flow |
| `/api/login/credentials` | POST | Submit email/password |
| `/api/login/2fa` | POST | Submit 2FA code |
| `/api/logout` | POST | Logout and clear session |
| `/api/screenshot` | GET | Get browser screenshot |
| `/api/conversations` | GET | Get conversation list |
| `/api/messages/send` | POST | Send a message |
| `/api/auto-reply` | POST | Toggle auto-reply |
| `/api/navigate` | POST | Navigate to a thread |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `status` | Server → Client | Connection/login status update |
| `conversations` | Server → Client | Conversation list update |
| `messages` | Server → Client | Messages for current thread |
| `newMessage` | Server → Client | New incoming message |
| `screenshot` | Server → Client | Browser screenshot |
| `error` | Server → Client | Error notification |

## AI Integration

Fred is designed to integrate with external AI systems. When `autoReply` is enabled, new messages emit a `message` event with `needsReply: true`. Connect your AI to:

1. Listen for the `message` event on the MessengerService
2. Generate a response using your AI system
3. Call `messengerService.sendMessage(threadId, response)` to reply

Example integration point in `server/services/messenger.js`:

```javascript
async handleAutoReply(threadId, message) {
  // Integrate your AI here
  const aiResponse = await yourAI.generateResponse(message.text);
  await this.sendMessage(threadId, `🤖 ${aiResponse}`);
}
```

## Project Structure

```
fred-messenger/
├── server/
│   ├── index.js           # Express + WebSocket server
│   └── services/
│       ├── messenger.js   # Puppeteer automation service
│       └── session.js     # Session management
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Styles
│   ├── main.jsx           # React entry point
│   └── index.css          # Base styles
├── public/
│   └── robot.svg          # Favicon
├── data/                  # Created at runtime
│   ├── cookies.json       # Session cookies
│   └── sessions.json      # App sessions
├── package.json
├── vite.config.js
└── README.md
```

## Troubleshooting

### Browser fails to launch
- Ensure you have the necessary dependencies for Puppeteer
- On Linux: `sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2`

### Login fails with error
- Facebook may require verification from a known browser
- Try logging in from your regular browser first
- Wait a few minutes and try again

### 2FA code not working
- Ensure you're entering the current code (they rotate every 30 seconds)
- Check if Facebook is asking for a different type of verification

### Messages not loading
- The web scraping selectors may need updating if Facebook changes their UI
- Check the console for errors
- Try refreshing the browser preview

## Disclaimer

This project uses browser automation to interact with Facebook Messenger. Please be aware:

- This is **unofficial** and not endorsed by Facebook/Meta
- Facebook may change their UI at any time, potentially breaking this tool
- Automated interactions may violate Facebook's Terms of Service
- Use responsibly and at your own risk
- Do not use for spam or unauthorized access

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Credits

Built with:
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Puppeteer](https://pptr.dev/)
- [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)
