# AI Agent Dashboard Deployment

## Local Development

The dashboard is designed to run locally alongside your Moltbot Gateway instance.

### Prerequisites
- Node.js 18+
- Moltbot Gateway running on port 18789 (default)

### Setup
```bash
cd fb-messenger-project
npm install
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173
- **API Proxy**: http://localhost:8787 (proxies to Moltbot Gateway)

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment Options

### Option 1: Local Only (Recommended)
Since the dashboard manages your local Moltbot instance, it's best run locally:

1. Build the project: `npm run build`
2. Serve the `dist/` folder with any static file server
3. Configure your browser to access it via localhost or local network IP

### Option 2: Cloudflare Pages (Remote Access)
If you want remote access, you can deploy to Cloudflare Pages:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Create a new Pages project
3. Connect your GitHub repository
4. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Set environment variable `VITE_MOLTBOT_GATEWAY_URL` to your Moltbot Gateway URL

**Note**: For remote access, ensure your Moltbot Gateway is accessible from the internet (consider Tailscale, ngrok, or proper firewall configuration).

### Option 3: Docker Container
You can containerize the dashboard for easy deployment:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Security Considerations

- **Account Credentials**: Stored locally in `data/accounts.json` (never sent to remote servers)
- **Moltbot Authentication**: Uses Moltbot's built-in authentication system
- **Local Storage**: API keys and session data stored in browser localStorage
- **CORS**: Proper CORS headers configured for security

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MOLTBOT_GATEWAY_URL` | `http://localhost:18789` | Moltbot Gateway URL |
| `VITE_API_PROXY_PORT` | `8787` | Local API proxy port |

## Troubleshooting

### Blank Screen
- Ensure Moltbot Gateway is running
- Check browser console for connection errors
- Verify `VITE_MOLTBOT_GATEWAY_URL` is correct

### API Connection Issues
- Check that the local API proxy is running (`npm run dev:api`)
- Verify Moltbot Gateway is accessible at the configured URL
- Check Moltbot Gateway logs for authentication issues

### Account Storage Issues
- Ensure the `data/` directory has write permissions
- Check that `accounts.json` is properly formatted JSON