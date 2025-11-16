# SSL Setup Guide for app-learn.mooo.com

Complete guide to setup HTTPS/SSL for your domain with Let's Encrypt.

---

## Overview

- **Domain**: app-learn.mooo.com
- **SSL Provider**: Let's Encrypt (Free)
- **Auto-renewal**: Yes
- **Certificate Type**: HTTPS
- **Setup Time**: ~10 minutes

---

## Prerequisites

✅ Domain pointing to your server IP (DNS configured)
✅ Server with Ubuntu 20.04+
✅ Nginx installed
✅ Application deployed to /home/applearn/app-learn-backend

---

## Step 1: Verify Domain Pointing to Server

Before setting up SSL, make sure your domain is pointing to your server:

```bash
# Check if domain resolves to your server IP
nslookup app-learn.mooo.com
# Should show your server's IP address

# Or
dig app-learn.mooo.com
# Should show your server's IP in ANSWER section
```

If domain is not pointing to your server:
1. Go to your domain registrar (where you bought the domain)
2. Update DNS A record to point to your server IP
3. Wait 5-30 minutes for DNS to propagate
4. Verify with `nslookup app-learn.mooo.com`

---

## Step 2: Install Certbot

```bash
# Update package manager
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

---

## Step 3: Copy Nginx Configuration

The nginx.conf has already been updated for your domain. Now copy it to the server:

```bash
# On your server:
sudo cp /home/applearn/app-learn-backend/nginx.conf /etc/nginx/sites-available/app-learn-api

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
# Should output: "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 4: Setup SSL with Let's Encrypt

### Option A: Automatic Setup (Recommended)

```bash
# Generate SSL certificate for your domain
sudo certbot certonly --nginx -d app-learn.mooo.com -d www.app-learn.mooo.com

# Follow the prompts:
# 1. Enter your email address (for certificate notifications)
# 2. Agree to terms of service (A)
# 3. Choose whether to share email with EFF (Y/N)
```

### Option B: Standalone Setup (If Nginx not working)

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d app-learn.mooo.com -d www.app-learn.mooo.com

# Restart Nginx
sudo systemctl start nginx
```

---

## Step 5: Verify SSL Certificate Installation

```bash
# Check certificate details
sudo certbot certificates

# Should show:
# - Found an ISRSA certificate and key pair: /etc/letsencrypt/live/app-learn.mooo.com/...
# - Domains: app-learn.mooo.com, www.app-learn.mooo.com
# - Expiry date: (90 days from now)

# Test SSL certificate
openssl s_client -connect app-learn.mooo.com:443 -tls1_2
# Press Ctrl+C to exit
```

---

## Step 6: Update Nginx Configuration with SSL Paths

The nginx.conf already has the correct paths. Just reload Nginx:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## Step 7: Test HTTPS Access

```bash
# Test from command line
curl -I https://app-learn.mooo.com/api/docs

# Should show:
# HTTP/2 200
# No SSL errors

# Or visit in browser
# https://app-learn.mooo.com/api/docs
```

---

## Step 8: Setup Auto-Renewal

Let's Encrypt certificates are valid for 90 days. Setup auto-renewal:

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Should complete without errors

# Enable automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal timer
sudo systemctl status certbot.timer
sudo systemctl list-timers certbot.timer
```

---

## Step 9: Verify SSL Configuration

```bash
# Check SSL strength
curl -I https://app-learn.mooo.com/api/docs
# Should show:
# - HTTP/2 200
# - Proper SSL/TLS headers
# - No warnings

# SSL Labs test (optional, online test)
# Go to: https://www.ssllabs.com/ssltest/analyze.html?d=app-learn.mooo.com
```

---

## Update Application Configuration

### 1. Update .env.production

The file has already been updated with:
```env
APP_URL=https://app-learn.mooo.com
```

### 2. Redeploy Application

```bash
cd /home/applearn/app-learn-backend

# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart application
pm2 restart app-learn-api
```

---

## Common Issues & Solutions

### Issue 1: "acme_client: error performing HTTP-01 challenge"
**Cause**: Domain not pointing to server yet
**Solution**: Wait for DNS propagation (5-30 minutes) and retry

### Issue 2: "Connection refused on port 80"
**Cause**: Port 80 not open or firewall blocking
**Solution**:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Issue 3: "Certificate not found at renewal"
**Cause**: Renewal job failed
**Solution**:
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Issue 4: Nginx test failed
**Cause**: Syntax error in nginx config
**Solution**:
```bash
sudo nginx -t  # Shows exact error
# Fix the error and reload
sudo systemctl reload nginx
```

---

## Monitoring SSL Certificate Expiry

```bash
# Check certificate expiry date
sudo certbot certificates

# Get days until expiry
echo "Certificate expires in:" && \
sudo certbot certificates | grep "Expiry Date" && \
echo "Auto-renewal is enabled, no action needed"
```

---

## SSL Renewal Manual Test

```bash
# Simulate renewal (safe, doesn't actually renew)
sudo certbot renew --dry-run

# Manual renewal (if needed)
sudo certbot renew --force-renewal

# After renewal, reload Nginx
sudo systemctl reload nginx
```

---

## Complete HTTPS Setup Verification Checklist

```
✓ Domain points to server (DNS verified)
✓ Nginx installed and running
✓ nginx.conf updated for app-learn.mooo.com
✓ Certbot installed
✓ SSL certificate generated
✓ Certificate paths in nginx.conf correct
✓ Nginx reloaded with SSL config
✓ HTTPS accessible at https://app-learn.mooo.com
✓ Auto-renewal enabled
✓ .env.production updated with APP_URL
✓ Application restarted
✓ Health check passing at https://app-learn.mooo.com/api/docs
```

---

## Testing Your HTTPS Setup

### Command Line Test
```bash
# Test API endpoint
curl -I https://app-learn.mooo.com/api/docs

# Test with verbose output to see SSL details
curl -v https://app-learn.mooo.com/api/docs
```

### Browser Test
```
Navigate to:
https://app-learn.mooo.com/api/docs

You should see:
- Green lock icon in browser
- No SSL warnings
- Page loads successfully
- Swagger docs visible
```

### Online SSL Test
```
Visit: https://www.ssllabs.com/ssltest/
Enter: app-learn.mooo.com
Should get: A or A+ rating
```

---

## After Setup: Next Steps

1. **Setup Monitoring**
   ```bash
   # Add to UptimeRobot
   https://app-learn.mooo.com/api/docs
   ```

2. **Update Client Applications**
   - Update frontend to use: https://app-learn.mooo.com/api
   - Update mobile apps to use: https://app-learn.mooo.com/api

3. **Verify All Endpoints**
   ```bash
   # Test API endpoints
   curl https://app-learn.mooo.com/api/docs
   curl https://app-learn.mooo.com/api/health
   ```

4. **Check Logs**
   ```bash
   # Application logs
   pm2 logs app-learn-api

   # Nginx logs
   sudo tail -f /var/log/nginx/app-learn-error.log
   ```

---

## Certificate Renewal Details

Your Let's Encrypt certificate:
- **Valid for**: 90 days
- **Auto-renewal**: Enabled (runs at 2 AM daily)
- **Renewal window**: Starts at day 60, before expiry
- **No action needed**: Automatic renewal handles everything

---

## Emergency Commands

```bash
# Stop application temporarily
sudo systemctl stop app-learn-api

# Start application
sudo systemctl start app-learn-api

# Restart Nginx
sudo systemctl restart nginx

# View live logs
journalctl -u app-learn-api -f

# Check certificate status
sudo certbot certificates

# Force certificate renewal
sudo certbot renew --force-renewal

# Reload configuration without restart
sudo systemctl reload nginx
```

---

## Security Best Practices

✅ Always use HTTPS (enforced via Nginx redirect)
✅ Keep certificate auto-renewal enabled
✅ Monitor certificate expiry
✅ Regularly update system packages
✅ Use strong JWT secret
✅ Enable firewall (UFW)
✅ Disable SSH password authentication

```bash
# Enable security measures
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP (redirects to HTTPS)
sudo ufw allow 443/tcp # HTTPS

# Disable SSH password login (optional)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Then: sudo systemctl restart ssh
```

---

## Support & Testing

### SSL Test Tools
- **Command Line**: `openssl s_client -connect app-learn.mooo.com:443`
- **Online**: https://www.ssllabs.com/ssltest/
- **HTTP Header Check**: https://securityheaders.com/?q=app-learn.mooo.com

### View Certificate Details
```bash
# Install in browser to see certificate details
# Or use openssl:
openssl x509 -in /etc/letsencrypt/live/app-learn.mooo.com/cert.pem -text -noout
```

---

## Final Verification

```bash
# Everything working?
echo "Testing HTTPS..." && \
curl -I https://app-learn.mooo.com/api/docs && \
echo "" && \
echo "✅ HTTPS is working!" && \
echo "" && \
echo "Certificate info:" && \
sudo certbot certificates | grep app-learn.mooo.com && \
echo "" && \
echo "Auto-renewal:" && \
sudo systemctl status certbot.timer
```

---

## Certificate Expiry Dates

- **Current certificate**: Valid for 90 days from creation
- **Renewal starts**: Day 60
- **Automatic renewal**: Enabled (runs daily)
- **Manual check**: `sudo certbot certificates`

You will receive email notifications at:
- 20 days before expiry
- 10 days before expiry
- 1 day before expiry

---

## Summary

✅ SSL Certificate: Installed and auto-renewing
✅ Domain: app-learn.mooo.com configured
✅ HTTPS: Enforced (HTTP redirects to HTTPS)
✅ Nginx: Updated and reloaded
✅ Application: Ready to serve HTTPS requests
✅ Monitoring: Auto-renewal enabled

**Your application is now running on HTTPS!** 🔒

Access it at: **https://app-learn.mooo.com/api/docs**

---

**Created**: 2024-11-17
**Domain**: app-learn.mooo.com
**SSL Provider**: Let's Encrypt
**Certificate Valid**: 90 days (auto-renewal enabled)
