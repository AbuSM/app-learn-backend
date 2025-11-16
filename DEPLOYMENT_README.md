# 🚀 Production Deployment Configuration

Complete production-ready deployment setup for App Learn Backend. Choose your preferred deployment method and follow the guided setup.

---

## 📋 Overview

This repository includes everything needed to deploy the application to production:

### Deployment Methods

1. **🐳 Docker Compose** (Recommended) - Containerized deployment
2. **⚡ PM2 + Nginx** (Traditional) - Traditional server deployment
3. **🔄 Automated** - Bash scripts for automated setup and deployment

### What's Included

✅ Environment configuration
✅ Process management (PM2)
✅ Reverse proxy (Nginx)
✅ Containerization (Docker)
✅ Auto-scaling setup
✅ SSL/HTTPS configuration
✅ Database setup & migrations
✅ Monitoring & logging
✅ Backup procedures
✅ Health checks
✅ Automated deployment scripts

---

## 🚀 Quick Start

### Option 1: Docker Compose (Fastest - 5 minutes)

```bash
# 1. Clone and setup
git clone <repo-url> && cd app-learn-backend

# 2. Configure
cp .env.production .env
nano .env  # Edit database password, JWT secret

# 3. Deploy
docker-compose up -d

# 4. Verify
curl http://localhost:3000/api/docs
```

**Next**: [Setup SSL](#ssl-configuration)

### Option 2: PM2 + Nginx (Traditional - 15 minutes)

```bash
# 1. Run automated setup
curl -fsSL https://raw.githubusercontent.com/your-repo/setup-prod.sh | sudo bash

# 2. As applearn user
sudo su - applearn
cd ~/app-learn-backend
git clone <repo-url> .

# 3. Build
npm install && npm run build

# 4. Configure
nano .env.production.local

# 5. Start
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

**Next**: [Configure Nginx](#nginx-setup)

### Option 3: Full Automated Setup

```bash
# One command setup (requires sudo)
bash setup-prod.sh
```

---

## 📁 Configuration Files

### Core Files

| File | Purpose | Size |
|------|---------|------|
| `.env.production` | Production environment variables | 904B |
| `ecosystem.config.js` | PM2 process management config | 1.3K |
| `nginx.conf` | Reverse proxy & load balancing | 4.4K |
| `Dockerfile` | Container image definition | 1.3K |
| `docker-compose.yml` | Multi-container orchestration | 2.1K |

### Automation Scripts

| Script | Purpose | Size |
|--------|---------|------|
| `setup-prod.sh` | One-command server setup | 4.5K |
| `deploy.sh` | Automated deployment with rollback | 8.5K |
| `app-learn-api.service` | Systemd service file | 822B |
| `init-db.sql` | Database initialization | - |

### Documentation

| Document | Content |
|----------|---------|
| `DEPLOYMENT.md` | Complete deployment guide (12K) |
| `MONITORING.md` | Monitoring & logging setup (10K) |
| `DEPLOYMENT_QUICK_START.md` | Quick reference (8.3K) |

---

## 🔧 Pre-Deployment Checklist

### Server Requirements

- [ ] Ubuntu 20.04+ or similar Linux
- [ ] Minimum 2GB RAM
- [ ] Minimum 20GB disk space
- [ ] Root or sudo access
- [ ] Domain name with DNS configured

### Application Requirements

- [ ] Node.js dependencies resolved
- [ ] Build completes without errors
- [ ] Tests passing
- [ ] Environment variables prepared
- [ ] Database migrations ready

### Security Requirements

- [ ] JWT_SECRET generated (min 32 chars)
- [ ] Database password changed
- [ ] CORS configured
- [ ] SSL certificate ready
- [ ] Firewall rules planned

---

## 🐳 Docker Deployment (Recommended)

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Setup Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd app-learn-backend

# 2. Configure environment
cp .env.production .env

# Edit with your settings
nano .env
```

**Important variables to change:**
```env
DB_PASSWORD=change_to_secure_password
JWT_SECRET=change_to_min_32_random_chars
APP_URL=https://your-domain.com
```

```bash
# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f api

# 5. Verify
curl http://localhost:3000/api/docs
```

### Docker Commands Reference

```bash
# View logs
docker-compose logs -f api          # Application logs
docker-compose logs -f postgres     # Database logs
docker-compose logs -f nginx        # Nginx logs

# Restart services
docker-compose restart api          # Restart API only
docker-compose restart              # Restart all

# Stop services
docker-compose down                 # Stop and remove containers
docker-compose stop                 # Stop without removing

# Database operations
docker-compose exec postgres psql -U app_learn_user -d app_learn_db

# Update/redeploy
git pull
docker-compose build
docker-compose up -d
```

---

## ⚡ PM2 + Nginx Deployment

### System Setup

```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install SSL support
sudo apt install -y certbot python3-certbot-nginx
```

### Application Setup

```bash
# 1. Create app user
sudo useradd -m -s /bin/bash applearn
sudo su - applearn

# 2. Clone repository
git clone <repo-url> ~/app-learn-backend
cd ~/app-learn-backend

# 3. Install dependencies
npm install
npm run build

# 4. Configure environment
nano .env.production.local
```

### Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Setup auto-restart on boot
pm2 startup
pm2 save

# View logs and monitor
pm2 logs app-learn-api
pm2 monit
```

### Configure Nginx

```bash
# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/app-learn-api

# Enable site
sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### PM2 Commands Reference

```bash
# Process management
pm2 start ecosystem.config.js       # Start
pm2 stop app-learn-api              # Stop
pm2 restart app-learn-api           # Restart
pm2 reload app-learn-api            # Graceful reload
pm2 delete app-learn-api            # Delete process

# Monitoring
pm2 logs                             # View logs
pm2 monit                            # Real-time monitor
pm2 show app-learn-api              # Detailed info

# Maintenance
pm2 save                             # Save state
pm2 startup                          # Auto-start on boot
pm2 kill                             # Stop PM2 daemon
```

---

## 🔐 SSL/HTTPS Configuration

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com

# Certificate will be installed at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# Update nginx.conf with certificate paths
# Then reload:
sudo systemctl reload nginx

# Auto-renewal
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
```

### Self-Signed Certificate (Testing Only)

```bash
# Generate self-signed cert
sudo openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt

# Update nginx.conf to use these paths
```

---

## 📊 Monitoring & Logging

### View Application Logs

```bash
# PM2 logs
pm2 logs app-learn-api

# System logs
journalctl -u app-learn-api -f

# Nginx logs
sudo tail -f /var/log/nginx/app-learn-error.log
```

### Health Monitoring

```bash
# Application health
curl https://your-domain.com/api/docs

# Database connection
curl https://your-domain.com/api/health

# System resources
pm2 monit          # PM2
docker stats       # Docker
top                # System

# Automated monitoring
# See MONITORING.md for detailed setup
```

### Setup Uptime Monitoring

1. Visit [UptimeRobot.com](https://uptimerobot.com)
2. Create account
3. Add monitor with:
   - URL: `https://your-domain.com/api/docs`
   - Interval: 5 minutes
   - Alert email: your-email@company.com

---

## 🔄 Automated Deployment

### Using Deploy Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh

# Rollback if needed
./deploy.sh --rollback

# View help
./deploy.sh --help
```

### What Deploy Script Does

1. ✅ Checks prerequisites
2. ✅ Creates backup
3. ✅ Pulls latest code
4. ✅ Installs dependencies
5. ✅ Builds application
6. ✅ Runs migrations
7. ✅ Runs tests
8. ✅ Stops old instance
9. ✅ Starts new instance
10. ✅ Health checks
11. ✅ Rollbacks on failure

---

## 💾 Database Management

### Initial Setup

```bash
# Create user and database
sudo -u postgres psql << 'EOF'
CREATE USER app_learn_user WITH PASSWORD 'secure-password';
CREATE DATABASE app_learn_db OWNER app_learn_user;
GRANT ALL PRIVILEGES ON DATABASE app_learn_db TO app_learn_user;
EOF

# Test connection
psql -U app_learn_user -h localhost -d app_learn_db -c "SELECT 1;"
```

### Backups

```bash
# Manual backup
pg_dump -U app_learn_user app_learn_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
zcat backup.sql.gz | psql -U app_learn_user -d app_learn_db

# Automated daily backups (see DEPLOYMENT.md)
```

---

## 🔍 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs app-learn-api
docker-compose logs api

# Check port availability
lsof -i :3000

# Rebuild and restart
npm run build
pm2 restart app-learn-api
```

### Database Connection Error

```bash
# Test connection
psql -U app_learn_user -h localhost -d app_learn_db

# Check service
systemctl status postgresql
sudo systemctl restart postgresql

# View logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Nginx/SSL Issues

```bash
# Test Nginx config
sudo nginx -t

# View error log
sudo tail -f /var/log/nginx/error.log

# Check certificate
sudo openssl x509 -in /etc/letsencrypt/live/*/fullchain.pem -text -noout

# Reload
sudo systemctl reload nginx
```

---

## 📚 Documentation Structure

```
📦 app-learn-backend
├── 📄 DEPLOYMENT.md              # Complete deployment guide
├── 📄 DEPLOYMENT_QUICK_START.md  # Quick reference
├── 📄 MONITORING.md              # Monitoring setup
├── 📄 DEPLOYMENT_README.md       # This file
├── 🔧 Configuration Files
│   ├── .env.production           # Environment variables
│   ├── ecosystem.config.js       # PM2 config
│   ├── nginx.conf                # Nginx config
│   ├── docker-compose.yml        # Docker setup
│   └── Dockerfile                # Container image
├── 🚀 Deployment Scripts
│   ├── setup-prod.sh             # Automated setup
│   ├── deploy.sh                 # Automated deployment
│   └── app-learn-api.service     # Systemd service
└── 🗄️ Database
    └── init-db.sql               # Database initialization
```

---

## ✅ Post-Deployment Checklist

After deploying, verify:

- [ ] Application accessible at https://your-domain.com/api/docs
- [ ] Health checks passing
- [ ] SSL certificate valid and not expiring soon
- [ ] Database backups configured
- [ ] Logs rotating properly
- [ ] Monitoring alerts configured
- [ ] Team has access and documentation
- [ ] Runbook created for common tasks
- [ ] Disaster recovery tested
- [ ] Performance baseline recorded

---

## 🆘 Getting Help

### Documentation

1. **Full Guide**: See `DEPLOYMENT.md`
2. **Quick Reference**: See `DEPLOYMENT_QUICK_START.md`
3. **Monitoring**: See `MONITORING.md`
4. **API Docs**: `https://your-domain.com/api/docs`

### Common Commands

```bash
# Status checks
pm2 status                          # Process status
docker-compose ps                   # Container status
systemctl status app-learn-api      # Service status

# Logs
pm2 logs app-learn-api             # Application logs
docker-compose logs -f api         # Docker logs
journalctl -u app-learn-api -f     # System logs

# Restart
pm2 restart app-learn-api          # PM2
docker-compose restart api         # Docker
systemctl restart app-learn-api    # Systemd

# Health check
curl https://your-domain.com/api/docs
curl https://your-domain.com/api/health
```

---

## 🔐 Security Notes

⚠️ **Critical: Change these immediately:**

1. **Database Password** - In `.env.production`
2. **JWT Secret** - Minimum 32 random characters
3. **CORS Origin** - Set to your domain(s)
4. **Root Access** - Disable SSH root login
5. **Firewall** - Configure to allow only necessary ports

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
```

---

## 📞 Support Matrix

| Issue | Quick Fix | Full Guide |
|-------|-----------|-----------|
| App won't start | Check logs | DEPLOYMENT.md#Troubleshooting |
| Database error | Test connection | DEPLOYMENT.md#Database |
| SSL not working | Run certbot | DEPLOYMENT.md#SSL |
| High memory usage | Restart app | MONITORING.md |
| Need backup | See script | DEPLOYMENT.md#Backups |

---

## 🎯 Next Steps

1. **Choose deployment method** - Docker or PM2
2. **Run setup script** - Automates most steps
3. **Configure environment** - Edit `.env.production`
4. **Deploy application** - Use appropriate method
5. **Setup monitoring** - See MONITORING.md
6. **Test thoroughly** - Run health checks
7. **Document setup** - Keep runbook updated
8. **Train team** - Share access and procedures

---

## 📅 Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Check logs | Daily | `pm2 logs` |
| Review performance | Weekly | `pm2 monit` |
| Update dependencies | Monthly | `npm update` |
| SSL renewal test | Quarterly | `certbot renew --dry-run` |
| Security audit | Quarterly | Checklist review |
| Disaster recovery test | Annually | Test restore |

---

## 📝 Version Information

- **Created**: 2024-11-17
- **Last Updated**: 2024-11-17
- **Node.js Version**: 18.x
- **PostgreSQL Version**: 12+
- **Docker Version**: 20.10+
- **Nginx Version**: 1.18+

---

## 📞 Emergency Support

| Role | Contact | Response Time |
|------|---------|----------------|
| DevOps | devops@company.com | 1 hour |
| Database | dba@company.com | 2 hours |
| Security | security@company.com | 30 mins |

---

**✅ You're ready to deploy!**

For detailed information, refer to the specific documentation files mentioned above.

*Questions? See DEPLOYMENT_QUICK_START.md for common issues.*
