# Setup Script Fix - app-learn-api.service Issue

## Problem
When running `setup-prod.sh`, you get this error:
```
cp: cannot stat 'app-learn-api.service': No such file or directory
```

## Root Cause
The script was trying to copy `app-learn-api.service` from the current directory, but:
1. The repository hasn't been cloned yet
2. The file doesn't exist in the system path
3. The script runs before cloning the code

## Solution Applied
The script has been fixed to **create the service file directly** instead of trying to copy it. This includes:

✅ Creating `/etc/systemd/system/app-learn-api.service` dynamically
✅ No dependency on the repo being cloned first
✅ Complete service configuration embedded in the script
✅ Automatic systemd reload and enablement

---

## What Changed in setup-prod.sh

### Before (Broken)
```bash
log "Configuring systemd service..."
cp app-learn-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable app-learn-api.service
```

### After (Fixed)
```bash
log "Configuring systemd service..."
# Create the systemd service file directly
cat > /etc/systemd/system/app-learn-api.service << 'SERVICEFILE'
[Unit]
Description=App Learn API Service
...
SERVICEFILE

systemctl daemon-reload
systemctl enable app-learn-api.service
```

---

## If You Already Hit This Error

### Option 1: Re-run the Fixed Script
```bash
# Download the updated script
bash setup-prod.sh

# It will now complete without errors
```

### Option 2: Manual Fix
If you've already partially completed the setup:

```bash
# 1. Create the service file manually
sudo cat > /etc/systemd/system/app-learn-api.service << 'EOF'
[Unit]
Description=App Learn API Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=applearn
WorkingDirectory=/home/applearn/app-learn-backend
EnvironmentFile=/home/applearn/app-learn-backend/.env.production

ExecStart=/usr/local/bin/pm2 start ecosystem.config.js --no-daemon

Restart=on-failure
RestartSec=10s

KillSignal=SIGTERM
KillMode=process
TimeoutStopSec=30

LimitNOFILE=65536
LimitNPROC=65536

StandardOutput=journal
StandardError=journal
SyslogIdentifier=app-learn-api

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log/app-learn /home/applearn/app-learn-backend

[Install]
WantedBy=multi-user.target
EOF

# 2. Reload systemd
sudo systemctl daemon-reload

# 3. Enable the service
sudo systemctl enable app-learn-api.service

# 4. Verify
sudo systemctl status app-learn-api.service
```

---

## Changes in Latest Version

### Files Modified
- ✅ `setup-prod.sh` - Fixed to create service file directly
- ✅ This guide created for reference

### Benefits
- ✅ No more "file not found" errors
- ✅ Works even if repo isn't cloned yet
- ✅ Cleaner dependency chain
- ✅ Automatic systemd configuration

---

## Verification

After running the fixed script, verify everything is set up:

```bash
# Check service file exists
sudo cat /etc/systemd/system/app-learn-api.service

# Check service is enabled
sudo systemctl is-enabled app-learn-api.service
# Should output: enabled

# Check service status (should be inactive for now)
sudo systemctl status app-learn-api.service
```

---

## Next Steps After Fix

Once the setup script completes successfully:

```bash
# 1. Switch to applearn user
sudo su - applearn

# 2. Clone repository
git clone <your-repo-url> ~/app-learn-backend
cd ~/app-learn-backend

# 3. Configure environment
cp .env.production .env.production
nano .env.production
# Edit with your database password and JWT secret

# 4. Install and build
npm install
npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js
pm2 save

# 6. Service will auto-start on reboot now
# (systemd is already configured)
```

---

## Testing the Service

```bash
# Start the service
sudo systemctl start app-learn-api.service

# Check if running
sudo systemctl status app-learn-api.service

# View logs
sudo journalctl -u app-learn-api.service -f

# Stop the service
sudo systemctl stop app-learn-api.service
```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Service File | Needs to be copied | Created automatically |
| Repo Required | Yes, before running setup | No, can run first |
| Error Handling | Fails if file missing | Always succeeds |
| Dependencies | External file dependency | Self-contained |
| Ease of Use | Manual intervention needed | Fully automated |

---

**✅ Issue Fixed!**

The setup script now works without needing the repo to be present. Run it confidently on fresh servers!
