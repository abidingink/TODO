# AI Agent Dashboard - Deployment Instructions

## 🎯 Overview
This dashboard connects to your Moltbot Gateway instance running on Alibaba Cloud. It provides a comprehensive interface for managing AI agents, channels, jobs, and external accounts.

## 🔧 Step-by-Step Alibaba Cloud Setup

### 1. Configure Your Alibaba Cloud Instance

**A. Update Security Group**
- Go to Alibaba Cloud Console → ECS → Security Groups
- Add inbound rule: Port `18789`, Protocol `TCP`, Source `0.0.0.0/0` (or restrict to your IP for better security)

**B. Configure Moltbot Gateway**
```bash
# Check current config
moltbot config get

# Update to bind to public interface
moltbot config.patch '{
  "gateway": {
    "bind": "public",
    "port": 18789
  }
}'

# Add authentication (recommended)
moltbot config.patch '{
  "auth": {
    "mode": "password", 
    "password": "your-secure-password-here"
  }
}'
```

**C. Restart Moltbot Gateway**
```bash
moltbot gateway restart
```

### 2. Deploy the Dashboard

#### Option A: Render.com (Recommended)
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository: `https://github.com/abidingink/TODO`
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variable:
   - **Key**: `VITE_MOLTBOT_GATEWAY_URL`
   - **Value**: `http://YOUR_ALIBABA_PUBLIC_IP:18789`
7. Deploy!

#### Option B: Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Create Pages project
3. Connect GitHub repository: `https://github.com/abidingink/TODO`
4. Build settings:
   - Build command: `npm install && npm run build`
   - Build output directory: `dist`
5. Add environment variable:
   - **Environment variable**: `VITE_MOLTBOT_GATEWAY_URL`
   - **Value**: `http://YOUR_ALIBABA_PUBLIC_IP:18789`
6. Deploy!

### 3. Access Your Dashboard

Once deployed, visit your dashboard URL (e.g., `https://your-dashboard.onrender.com`).

**First-time setup:**
1. You'll see a setup screen asking for your Moltbot Gateway URL
2. Enter your authentication password (if configured)
3. The dashboard will connect and show your agent status

### 4. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_MOLTBOT_GATEWAY_URL` | Yes | `http://localhost:18789` | Your Moltbot Gateway URL |
| None | No | N/A | Authentication handled via dashboard UI |

## 🔐 Security Best Practices

1. **Use strong passwords** for Moltbot Gateway authentication
2. **Restrict security group rules** to your IP address when possible
3. **Consider Tailscale** for encrypted private networking instead of public exposure
4. **Monitor access logs** regularly for suspicious activity

## 🚨 Troubleshooting

### "Gateway Offline" Error
- Verify your Alibaba Cloud instance is running
- Check that port 18789 is open in security groups
- Ensure Moltbot Gateway is configured to bind to `public` not `loopback`

### "Authentication Failed" Error  
- Verify your password matches the one in Moltbot config
- Check that auth mode is set to `password` in Moltbot config

### Deployment Build Failures
- Ensure you're using the latest version from GitHub
- The repository includes all necessary fixes for both Render.com and Cloudflare Pages

## 📞 Support

If you encounter issues:
1. Check Moltbot logs: `moltbot logs --follow`
2. Verify network connectivity to your Alibaba instance
3. Review the [Moltbot documentation](https://docs.molt.bot)

---

**Your AI Agent Dashboard is now ready for remote management!** 🚀