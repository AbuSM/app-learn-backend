# Deploy Script Requirements

## Short Answer: **NO, `deploy.sh` alone won't work**

The `deploy.sh` script **assumes everything is already set up**. It expects a pre-configured server with all dependencies installed.

---

## What `deploy.sh` Expects to Already Exist

### 1. **System Prerequisites**
- ✅ Node.js 18+ installed
- ✅ PM2 installed globally
- ✅ PostgreSQL running and accessible
- ✅ Git installed
- ✅ Log directory created (`/var/log/app-learn/`)

### 2. **Directory Structure**
- ✅ Project directory at `/home/deploy/app-learn-backend`
- ✅ Backup directory at `/backups/app-learn`
- ✅ Code already cloned from Git

### 3. **Database**
- ✅ PostgreSQL database already created
- ✅ Database user already created
- ✅ Connection credentials in `.env.production`

### 4. **Environment Configuration**
- ✅ `.env.production` file must exist at project root
- ✅ Must contain: `DB_USERNAME`, `DB_HOST`, `DB_PASSWORD`, `DB_DATABASE`

### 5. **PM2**
- ✅ PM2 should already have app configured (or script will set it up)

---

## What `deploy.sh` DOES Do

✅ Pulls latest code from Git
✅ Installs dependencies
✅ Builds the application
✅ Runs database migrations
✅ Runs tests
✅ Creates backups before deploying
✅ Starts/restarts the application
✅ Performs health checks
✅ Rolls back on failure

---

## Recommended Deployment Flow

### Step 1: Initial Server Setup (Run Once)
```bash
# On your server as root
bash setup-prod.sh
```
This installs:
- Node.js
- PM2
- PostgreSQL
- Nginx
- Git
- Creates directories
- Sets up firewall

### Step 2: Prepare Application
```bash
# As deploy user
cd /home/deploy
git clone <your-repo-url> app-learn-backend
cd app-learn-backend

# Copy and configure environment
cp .env.production .env.production
nano .env.production  # Edit with your database credentials
```

### Step 3: Subsequent Deployments
```bash
# Just run deploy script
./deploy.sh
```

Or use the shortcut:
```bash
# Deploy and rollback if needed
./deploy.sh
./deploy.sh --rollback
```

---

## Complete Deployment Process

### First Time (Fresh Server)

```bash
# 1. SSH to server
ssh root@your-server-ip

# 2. Run setup script
bash setup-prod.sh

# 3. Switch to deploy user
su - deploy

# 4. Clone repo
git clone <repo> ~/app-learn-backend
cd ~/app-learn-backend

# 5. Configure environment
cp .env.production .env.production
nano .env.production

# 6. First deployment
./deploy.sh

# 7. Setup Nginx and SSL
sudo cp nginx.conf /etc/nginx/sites-available/app-learn-api
sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL
sudo certbot certonly --standalone -d your-domain.com

# Update nginx config with certificate paths
sudo nano /etc/nginx/sites-available/app-learn-api
sudo systemctl reload nginx
```

### Subsequent Deployments (Just one command)

```bash
cd ~/app-learn-backend
./deploy.sh
```

---

## What Gets Checked Before Deploy

The script checks for:

```
✓ Node.js installed
✓ PM2 installed
✓ PostgreSQL running and accessible
✓ Git installed
✓ .env.production exists
✓ Database credentials work
✓ Project directory exists
```

If any of these fail, the script exits with an error.

---

## If You Want to Skip Setup Script

You can manually do what `setup-prod.sh` does:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Git
sudo apt install -y git

# Install Nginx
sudo apt install -y nginx

# Create directories
sudo mkdir -p /var/log/app-learn /backups/app-learn
sudo chown deploy:deploy /var/log/app-learn /backups/app-learn

# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER app_learn_user WITH PASSWORD 'your-secure-password';
CREATE DATABASE app_learn_db OWNER app_learn_user;
EOF

# Clone repo
cd /home/deploy
git clone <repo> app-learn-backend
cd app-learn-backend

# Configure
cp .env.production .env.production
nano .env.production  # Edit with actual values

# Now run deploy
./deploy.sh
```

---

## Deploy Script Workflow

```
deploy.sh runs:
│
├─ 1. Check prerequisites
│   ├─ Node.js ✓
│   ├─ PM2 ✓
│   ├─ PostgreSQL ✓
│   └─ Git ✓
│
├─ 2. Create backup
│   ├─ Backup database
│   └─ Backup app files
│
├─ 3. Pull code
│   └─ git pull origin main
│
├─ 4. Build
│   ├─ npm ci --omit=dev
│   ├─ npm run build
│   └─ Run migrations
│
├─ 5. Test
│   └─ npm test
│
├─ 6. Deploy
│   ├─ Stop old instance
│   ├─ Start new instance
│   └─ Reload with zero downtime
│
└─ 7. Health check
    └─ Verify API responding
```

---

## Common Issues If Running Only `deploy.sh`

### Error 1: "Node.js is not installed"
**Solution**: Run `setup-prod.sh` first

### Error 2: "PM2 is not installed"
**Solution**: `npm install -g pm2`

### Error 3: "Cannot connect to PostgreSQL database"
**Solution**:
- Database must exist
- User must exist
- Credentials in `.env.production` must match

### Error 4: "Cannot find /home/deploy/app-learn-backend"
**Solution**:
- Clone repo first: `git clone <repo> /home/deploy/app-learn-backend`
- Or update paths in deploy.sh

### Error 5: ".env.production not found"
**Solution**:
- Create: `cp .env.production .env.production`
- Edit with your credentials

---

## Quick Checklist Before Running deploy.sh

```
Pre-deployment Checklist:
□ Server provisioned (Ubuntu 20.04+)
□ Node.js installed (v18+)
□ PM2 installed globally
□ PostgreSQL installed and running
□ Git installed
□ /var/log/app-learn/ directory exists
□ /backups/app-learn/ directory exists
□ Project cloned to /home/deploy/app-learn-backend
□ .env.production file exists with correct DB credentials
□ Database user created in PostgreSQL
□ Database exists in PostgreSQL
□ Can connect to DB with credentials: psql -U app_learn_user -h localhost -d app_learn_db

✅ All checked? Then run: ./deploy.sh
```

---

## Summary

| Question | Answer |
|----------|--------|
| **Can I run just deploy.sh?** | No, needs setup first |
| **What do I run first?** | `bash setup-prod.sh` OR manual setup |
| **Then what?** | Configure `.env.production` |
| **Then?** | `./deploy.sh` |
| **Next deployments?** | Just `./deploy.sh` |

---

## Two-Step Process (Recommended)

### Step 1: One-time setup
```bash
bash setup-prod.sh
```

### Step 2: Deploy (any time you want)
```bash
./deploy.sh
```

That's it! Everything else is automated.

---

**Total first deployment time**: ~20 minutes
**Subsequent deployments**: ~2-3 minutes

✅ After first deployment, you can update anytime with just `./deploy.sh`
