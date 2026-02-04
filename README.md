# 🤖 Fred Messenger - Facebook Messenger AI Assistant

A complete Facebook Messenger integration system that monitors chats for mentions of "Fred" and automatically responds as an AI assistant.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Facebook Platform                           │
│  ┌──────────┐    Webhook Events    ┌──────────────────────┐    │
│  │ Messenger│─────────────────────▶│  Cloudflare Worker   │    │
│  │  Users   │◀─────────────────────│  (fred-messenger-api)│    │
│  └──────────┘    Graph API Reply   └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              │ KV Storage
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Dashboard                              │   │
│  │  • Monitor messages                                       │   │
│  │  • Configure auto-reply                                   │   │
│  │  • View conversation history                              │   │
│  │  • Manage AI settings                                     │   │
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

# Test webhook functionality
npm run test:webhook
```

### Build for Production

```bash
npm run build
```

## Deployment

### 1. Deploy Cloudflare Worker (Backend)

```bash
cd worker

# Create KV namespace
wrangler kv:namespace create FRED_KV
# Note the ID and update wrangler.toml

# Set secrets
wrangler secret put FB_PAGE_ACCESS_TOKEN
wrangler secret put FB_APP_SECRET
wrangler secret put OPENAI_API_KEY

# Deploy
wrangler deploy
```

### 2. Deploy Cloudflare Pages (Frontend)

**Option A: Via Cloudflare Dashboard**
1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your Git repository
4. Settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (or `/fb-messenger-project` if in monorepo)

**Option B: Via Wrangler CLI**
```bash
# Build the project
npm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=fred-messenger
```

### 3. Configure Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create/open your app
3. Add "Messenger" product
4. Configure Webhook:
   - **Callback URL**: `https://fred-messenger-api.<your-subdomain>.workers.dev/webhook`
   - **Verify Token**: `FRED_VERIFY_TOKEN_12345` (or your custom token)
   - **Subscriptions**: `messages`, `messaging_postbacks`
5. Generate Page Access Token
6. Subscribe your webhook to your Page

### 4. Update Dashboard Configuration

In `src/main.jsx` or via environment variable:
```javascript
window.FRED_API_URL = 'https://fred-messenger-api.<your-subdomain>.workers.dev';
```

Or set `VITE_WORKER_URL` during build.

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `triggerWord` | "fred" | Word that triggers AI response |
| `caseSensitive` | false | Case-sensitive trigger matching |
| `enabled` | true | Enable/disable auto-reply |
| `responsePrefix` | "🤖 Fred: " | Prefix for AI responses |
| `aiModel` | "gpt-4o-mini" | OpenAI model for responses |
| `maxResponseLength` | 2000 | Max response characters |

## API Endpoints

### Worker API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/webhook` | GET | Facebook verification |
| `/webhook` | POST | Receive Facebook events |
| `/api/messages` | GET | Get message history |
| `/api/config` | GET/POST | Get/update configuration |
| `/api/stats` | GET | Get statistics |
| `/api/conversations` | GET | Get conversation list |
| `/api/test` | GET | Test endpoint |

## Troubleshooting

### Blank Screen on Cloudflare Pages
- Ensure `index.html` exists in the `dist` folder
- Check that `_redirects` file contains: `/*    /index.html   200`
- Verify build command and output directory in Pages settings

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check verify token matches in Facebook App and Worker
- Ensure Page is subscribed to webhook events
- Check Worker logs for errors

### AI Not Responding
- Verify `OPENAI_API_KEY` secret is set
- Check trigger word detection (case sensitivity)
- Ensure `enabled` is true in config
- Review Worker logs for API errors

### CORS Errors
- Worker includes CORS headers for all origins
- For production, consider restricting to your Pages domain

## Project Structure

```
fb-messenger-project/
├── dist/                    # Production build output
├── public/                  # Static assets
├── scripts/
│   ├── local-api-server.js  # Local development API
│   └── test-webhook.js      # Webhook test script
├── src/
│   ├── App.jsx              # React dashboard
│   ├── App.css              # Dashboard styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── worker/
│   ├── src/
│   │   └── index.ts         # Cloudflare Worker
│   ├── wrangler.toml        # Worker configuration
│   └── .dev.vars            # Local secrets (not committed)
├── _headers                 # Cloudflare Pages headers
├── _redirects               # SPA routing for Pages
├── index.html               # HTML template
├── package.json
├── vite.config.js
└── README.md
```

## Development Notes

- The local API server (`scripts/local-api-server.js`) emulates the Worker for testing
- Use `npm run test:webhook` to simulate Facebook webhook events
- Messages are stored in-memory locally; in production, they persist in KV
- The Worker requires Node.js compatible runtime (Cloudflare Workers)

## Security Considerations

1. **Never commit secrets** - Use `.dev.vars` locally, Wrangler secrets in production
2. **API Key for Dashboard** - Set via `/api/setup-key` endpoint
3. **Facebook App Secret** - Used for validating webhook signatures (implement in production)
4. **Rate Limiting** - Consider implementing for production use

## License

MIT
