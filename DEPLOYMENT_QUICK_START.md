# App Learn Backend - Deployment Quick Start Guide

Fast track guide to get your application running in production.

## 5-Minute Setup (Docker - Recommended)

### Prerequisites
- Ubuntu 20.04+ server
- Root or sudo access
- Domain name configured

### Installation

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Run quick setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup-prod.sh | bash

# 3. Switch to app user
sudo su - applearn

# 4. Clone repository
git clone <your-repo-url> ~/app-learn-backend
cd ~/app-learn-backend

# 5. Configure environment
cp .env.production .env

# Edit with your settings (database password, JWT secret, domain)
nano .env

# 6. Start with Docker Compose
docker-compose up -d

# 7. Setup SSL
sudo certbot certonly --standalone -d your-domain.com

# 8. Update domain in nginx config
sudo nano /etc/nginx/sites-available/app-learn-api
# Update: server_name your-domain.com www.your-domain.com;

# 9. Reload Nginx
sudo systemctl reload nginx

# Done! Access at https://your-domain.com/api/docs
```

---

## 15-Minute Setup (PM2 Traditional)

### Installation

```bash
# 1. SSH into server and run setup
curl -fsSL https://raw.githubusercontent.com/your-repo/setup-prod.sh | sudo bash

# 2. Switch to app user
sudo su - applearn

# 3. Clone repository
git clone <your-repo-url> ~/app-learn-backend
cd ~/app-learn-backend

# 4. Install dependencies
npm install
npm run build

# 5. Configure environment
cp .env.production .env.production.local
nano .env.production.local

# 6. Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 7. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/app-learn-api
sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL
sudo certbot certonly --standalone -d your-domain.com
# Update /etc/nginx/sites-available/app-learn-api with certificate paths

# 9. Reload Nginx
sudo systemctl reload nginx

# Done!
```

---

## Key Configuration Files

### Environment Variables (.env.production)

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=app_learn_user
DB_PASSWORD=CHANGE_ME
DB_DATABASE=app_learn_db
JWT_SECRET=CHANGE_ME_MIN_32_CHARS
CORS_ORIGIN=true
APP_URL=https://your-domain.com
```

### Essential Commands

```bash
# View logs
pm2 logs app-learn-api
journalctl -u app-learn-api -f
docker-compose logs -f api

# Check status
pm2 status
systemctl status app-learn-api
docker-compose ps

# Restart application
pm2 restart app-learn-api
systemctl restart app-learn-api
docker-compose restart api

# Deploy new version
# With PM2:
git pull
npm install && npm run build
pm2 reload app-learn-api

# With Docker:
git pull
docker-compose build
docker-compose up -d

# Health check
curl https://your-domain.com/api/docs
```

---

## Database Setup

### Quick Database Setup

```bash
# Create user and database (run as postgres user)
sudo -u postgres psql << 'EOF'
CREATE USER app_learn_user WITH PASSWORD 'your-secure-password';
CREATE DATABASE app_learn_db OWNER app_learn_user;
GRANT ALL PRIVILEGES ON DATABASE app_learn_db TO app_learn_user;
EOF

# Test connection
psql -U app_learn_user -h localhost -d app_learn_db -c "SELECT 1;"
```

### Backup Database

```bash
# Manual backup
pg_dump -U app_learn_user app_learn_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from backup
zcat backup_20240101.sql.gz | psql -U app_learn_user -d app_learn_db

# Setup automatic daily backups
echo '0 2 * * * pg_dump -U app_learn_user app_learn_db | gzip > /backups/app_learn_db_$(date +\%Y\%m\%d).sql.gz' | crontab -
```

---

## SSL/HTTPS Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Auto-renew setup
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer

# Certificate paths for nginx.conf:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

---

## Monitoring

### Quick Health Check

```bash
# Is API responding?
curl -v https://your-domain.com/api/docs

# Check database
curl https://your-domain.com/api/health

# View logs
pm2 logs app-learn-api --lines 50

# Monitor performance
pm2 monit
```

### Common Issues

```bash
# API not responding
pm2 restart app-learn-api
pm2 logs app-learn-api

# Database connection error
psql -U app_learn_user -h localhost -d app_learn_db -c "SELECT 1;"

# Nginx errors
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# Out of disk space
df -h
du -sh /var/log/* | sort -hr

# High memory usage
pm2 show app-learn-api
pm2 kill && pm2 start ecosystem.config.js
```

---

## Deployment Checklist

- [ ] Server provisioned and updated
- [ ] Node.js and PostgreSQL installed
- [ ] Application code cloned
- [ ] .env.production configured with secure passwords
- [ ] Database created and migrations run
- [ ] Application built successfully
- [ ] PM2 or Docker Compose started
- [ ] Nginx configured and reload tested
- [ ] SSL certificate installed
- [ ] Health check passing (curl https://domain.com/api/docs)
- [ ] Logs being written
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] DNS pointing to server
- [ ] Firewall configured
- [ ] Team notified of deployment

---

## Production Secrets

**CHANGE THESE IMMEDIATELY:**

1. **Database Password** - Generate strong random password
   ```bash
   openssl rand -base64 32
   ```

2. **JWT Secret** - Minimum 32 characters
   ```bash
   openssl rand -base64 32
   ```

3. **Environment Variables** - Update .env.production with:
   - DB_PASSWORD
   - JWT_SECRET
   - APP_URL (your domain)
   - Any API keys/tokens

---

## Performance Tuning

### Increase Node.js Memory

```bash
# Edit ecosystem.config.js
NODE_OPTIONS=--max-old-space-size=1024

# Or edit PM2 startup
pm2 start ecosystem.config.js --node-args="--max-old-space-size=1024"
```

### Database Connection Pooling

Already configured in app.module.ts:

```typescript
TypeOrmModule.forRootAsync({
  // ... connection pool automatically configured
  // Connection limit: 10 (adjust based on load)
})
```

### Nginx Caching

Update nginx.conf proxy settings to enable caching for read-only endpoints:

```nginx
location /api/tasks/boards {
    proxy_cache default;
    proxy_cache_valid 200 1h;
}
```

---

## Support & Help

### Documentation Files

- **DEPLOYMENT.md** - Complete deployment guide
- **MONITORING.md** - Monitoring and logging setup
- **ecosystem.config.js** - PM2 configuration
- **docker-compose.yml** - Docker deployment
- **nginx.conf** - Reverse proxy configuration

### Common Commands Reference

```bash
# Service management
systemctl start|stop|restart app-learn-api
pm2 start|stop|restart app-learn-api
docker-compose start|stop|restart api

# View logs
journalctl -u app-learn-api -f
pm2 logs app-learn-api
docker-compose logs -f

# Database
psql -U app_learn_user -d app_learn_db
pg_dump -U app_learn_user app_learn_db > backup.sql

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# System
df -h
top
htop
```

---

## After Deployment

1. **Verify Everything Works**
   ```bash
   curl -v https://your-domain.com/api/docs
   ```

2. **Setup Monitoring**
   - UptimeRobot: Add https://your-domain.com/api/docs
   - Set notification email

3. **Configure Backups**
   - Daily at 2 AM
   - 30-day retention
   - Test restore procedure

4. **Document Changes**
   - Note server IP and credentials
   - Document custom configurations
   - Create runbook for common tasks

5. **Team Notification**
   - Inform team of deployment
   - Share access credentials
   - Conduct quick walkthrough

---

## Emergency Contacts

- **DevOps**: devops@company.com
- **Security**: security@company.com
- **Database Admin**: dba@company.com

---

## Further Reading

- [NestJS Production Checklist](https://docs.nestjs.com/deployment)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Server IP**: _______________
**Domain**: _______________

✅ **Ready for Production!**

For detailed information, see DEPLOYMENT.md and MONITORING.md
