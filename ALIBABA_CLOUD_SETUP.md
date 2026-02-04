# AI Agent Dashboard - Alibaba Cloud Setup Guide

## Prerequisites
- Moltbot running on your Alibaba Cloud instance
- Basic knowledge of Alibaba Cloud security groups
- Domain name (optional but recommended)

## Step 1: Configure Your Alibaba Cloud Instance

### 1.1 Update Security Group Rules
1. Go to **ECS Console** → **Instances**
2. Find your Moltbot instance and click on **Security Groups**
3. Add an inbound rule:
   - **Protocol**: TCP
   - **Port Range**: 18789
   - **Source**: Your IP address (recommended) or `0.0.0.0/0` (less secure)
   - **Description**: "Moltbot Gateway API"

### 1.2 Configure Moltbot Gateway for Public Access
Run these commands on your Alibaba Cloud instance:

```bash
# Check current configuration
moltbot config get

# Configure Moltbot to bind to public interface
moltbot config.patch '{
  "gateway": {
    "bind": "public",
    "port": 18789
  }
}'

# Add authentication for security (replace 'your-secure-password' with a strong password)
moltbot config.patch '{
  "auth": {
    "mode": "password",
    "password": "your-secure-password"
  }
}'

# Restart Moltbot to apply changes
moltbot gateway restart
```

### 1.3 Verify Moltbot is Accessible
Test the connection from your local machine:

```bash
# Replace YOUR_ALIBABA_IP with your actual instance IP
curl -u :your-secure-password http://YOUR_ALIBABA_IP:18789/health
```

You should see a JSON response with status information.

## Step 2: Deploy AI Agent Dashboard

### 2.1 Option A: Deploy to Render.com
1. Go to [Render.com](https://render.com)
2. Click **New Web Service**
3. Connect your GitHub repository (`abidingink/TODO`)
4. Set the following environment variables:
   - `VITE_MOLTBOT_GATEWAY_URL` = `http://YOUR_ALIBABA_IP:18789`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Click **Create Web Service**

### 2.2 Option B: Deploy to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub repository (`abidingink/TODO`)
4. Build settings:
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
5. Environment variables (under **Environment variables**):
   - `VITE_MOLTBOT_GATEWAY_URL` = `http://YOUR_ALIBABA_IP:18789`
6. Click **Save and Deploy**

## Step 3: Configure Dashboard Authentication

When you first access your deployed dashboard:

1. You'll see a **Setup** tab
2. Enter your Moltbot authentication password in the **Gateway Connection** section
3. Click **Save Token**
4. The dashboard will now communicate securely with your Alibaba Cloud Moltbot instance

## Step 4: Security Best Practices

### 4.1 Use a Strong Password
- Generate a strong, random password for Moltbot authentication
- Never use simple or guessable passwords

### 4.2 Restrict IP Access
- In your Alibaba Cloud security group, restrict port 18789 to only your IP address
- Update the rule whenever your IP changes

### 4.3 Consider Using Tailscale (Recommended)
For maximum security, consider using Tailscale instead of opening public ports:

```bash
# On your Alibaba Cloud instance
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey=YOUR_AUTH_KEY

# Configure Moltbot for Tailscale
moltbot config.patch '{
  "gateway": {
    "bind": "tailnet"
  },
  "auth": {
    "allowTailscale": true
  }
}'

# Set VITE_MOLTBOT_GATEWAY_URL to your Tailscale IP (e.g., http://100.x.y.z:18789)
```

## Troubleshooting

### Common Issues:
1. **"Cannot connect to gateway"**: 
   - Verify security group rules allow port 18789
   - Check that Moltbot is running (`moltbot status`)
   - Test connectivity with curl command above

2. **"Invalid authentication token"**:
   - Ensure you're using the correct password
   - Verify the auth mode is set to "password" in Moltbot config

3. **Deployment fails**:
   - Ensure you're using the latest version from GitHub
   - Check that all environment variables are set correctly

### Debug Commands:
```bash
# Check Moltbot status
moltbot status

# View Moltbot logs
moltbot logs --follow

# Test gateway health
curl http://localhost:18789/health

# Check firewall rules
sudo ufw status  # If using UFW
```

## Support

If you encounter issues, check:
- [Moltbot Documentation](https://docs.molt.bot)
- [AI Agent Dashboard GitHub](https://github.com/abidingink/TODO)
- Discord community: https://discord.com/invite/clawd

---

**Note**: Always keep your Moltbot instance updated and monitor access logs for suspicious activity.