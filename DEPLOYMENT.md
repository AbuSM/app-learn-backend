# App Learn Backend - Production Deployment Guide

Complete guide for deploying the NestJS backend application to a production server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Deployment Methods](#deployment-methods)
5. [SSL/HTTPS Configuration](#sslhttps-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Nginx**: 1.18 or higher
- **PM2**: Latest version (for process management)
- **Git**: For code deployment

### Required Software Installation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v22)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install Certbot for SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# Install Curl (for health checks)
sudo apt install -y curl
```

---

## Server Setup

### 1. Create Application User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash applearn
sudo usermod -aG sudo applearn

# Switch to the new user
sudo su - applearn
```

### 2. Clone Repository

```bash
# Create application directory
mkdir -p ~/app-learn-backend
cd ~/app-learn-backend

# Clone the repository
git clone https://github.com/your-username/app-learn-backend.git .

# If using SSH
git clone git@github.com:your-username/app-learn-backend.git .
```

### 3. Setup SSH Keys (Optional but recommended)

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "deploy@your-domain.com"

# Add to GitHub account
cat ~/.ssh/id_ed25519.pub

# Test SSH connection
ssh -T git@github.com
```

### 4. Create Log Directory

```bash
sudo mkdir -p /var/log/app-learn
sudo chown applearn:applearn /var/log/app-learn
sudo chmod 755 /var/log/app-learn
```

---

## Database Setup

### 1. Create PostgreSQL User and Database

```bash
# Switch to postgres user
sudo su - postgres

# Create user
createuser app_learn_user -P

# Create database
createdb app_learn_db -O app_learn_user

# Exit postgres user
exit
```

### 2. Configure PostgreSQL Connection

```bash
# Test connection
psql -U app_learn_user -h localhost -d app_learn_db -c "SELECT version();"
```

### 3. Setup PostgreSQL for Remote Access (if needed)

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change line:
# listen_addresses = 'localhost'
# to:
# listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add at the end:
# host    all    all    192.168.1.0/24    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Deployment Methods

### Method 1: Traditional PM2 Deployment

#### Step 1: Install Dependencies

```bash
cd ~/app-learn-backend

# Install production dependencies
npm ci --omit=dev

# If first time, install all dependencies
npm install
```

#### Step 2: Configure Environment

```bash
# Copy and edit production environment file
cp .env.production .env.production.local

# Edit with your settings
nano .env.production.local

# Or set environment variables
export DB_PASSWORD="your-secure-password"
export JWT_SECRET="your-very-secure-random-string"
```

#### Step 3: Build Application

```bash
npm run build
```

#### Step 4: Setup PM2

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Make PM2 start on boot
pm2 startup
pm2 save

# Monitor application
pm2 monit

# View logs
pm2 logs app-learn-api
```

#### Step 5: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/app-learn-api

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Method 2: Docker Deployment (Recommended)

#### Step 1: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker applearn

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Step 2: Prepare Docker Environment

```bash
cd ~/app-learn-backend

# Create .env file for docker-compose
cp .env.production .env

# Edit with your settings
nano .env
```

#### Step 3: Build and Run with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

#### Step 4: Verify Containers are Running

```bash
# Check database
docker-compose exec postgres psql -U app_learn_user -d app_learn_db -c "SELECT version();"

# Check API health
curl http://localhost:3000/api/docs

# Check Nginx
curl http://localhost/api/docs
```

---

## SSL/HTTPS Configuration

### Option 1: Let's Encrypt with Certbot

#### Step 1: Install SSL Certificate

```bash
# Stop Nginx if using certbot nginx plugin
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Follow prompts and complete ACME challenge
```

#### Step 2: Update Nginx Configuration

The nginx.conf file already includes SSL settings. Update:

```nginx
server_name your-domain.com www.your-domain.com;

ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

#### Step 3: Auto-Renew Certificate

```bash
# Create renewal hook
sudo certbot renew --dry-run

# Setup automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal status
sudo systemctl status certbot.timer
```

### Option 2: Docker with Let's Encrypt

The docker-compose setup can automatically handle SSL:

```bash
# Certbot will run automatically in docker-compose
docker-compose up -d certbot
```

---

## Monitoring & Logging

### View Application Logs

```bash
# PM2 Logs
pm2 logs app-learn-api

# Docker Logs
docker-compose logs -f api

# System Logs
journalctl -u app-learn-api.service -f
```

### Monitor Performance

```bash
# PM2 Monitoring
pm2 monit

# Docker Stats
docker stats

# System monitoring
top
htop  # if installed
```

### Setup Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/app-learn

# Add:
/var/log/app-learn/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 applearn applearn
    sharedscripts
    postrotate
        pm2 reload app-learn-api
    endscript
}

# Test configuration
sudo logrotate -d /etc/logrotate.d/app-learn
```

---

## Database Backups

### Automated Daily Backup

```bash
# Create backup script
nano ~/backup-db.sh

# Add:
#!/bin/bash
BACKUP_DIR="/backups/app-learn"
mkdir -p $BACKUP_DIR
pg_dump -U app_learn_user app_learn_db | gzip > $BACKUP_DIR/app_learn_db_$(date +%Y%m%d_%H%M%S).sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Make executable
chmod +x ~/backup-db.sh

# Add to crontab
crontab -e

# Add line:
# 0 2 * * * /home/applearn/backup-db.sh
```

---

## Deployment Automation

### Using the Deploy Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh

# With options
./deploy.sh --help
./deploy.sh --rollback  # Rollback to previous version
```

### Setting Up Webhook Deployment

```bash
# Install webhook handler
npm install -g webhook

# Create webhook config
nano webhook-config.json

# Start webhook listener
webhook -hooks webhook-config.json -verbose
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall (UFW)
- [ ] Setup SSH key-based authentication
- [ ] Disable SSH password login
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Setup rate limiting
- [ ] Configure security headers
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Monitor application logs
- [ ] Setup health checks
- [ ] Configure WAF rules
- [ ] Test recovery procedures

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow PostgreSQL (if remote)
sudo ufw allow 5432/tcp

# Check rules
sudo ufw status
```

---

## Health Checks

### Application Health Endpoint

```bash
# Check if application is running
curl http://localhost:3000/api/docs

# Using external health check
curl -f https://your-domain.com/api/docs || exit 1
```

### Uptime Monitoring

Setup external monitoring service like:
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring
- **StatusCake** - Uptime and performance monitoring

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs app-learn-api

# Check port availability
sudo lsof -i :3000

# Check Node.js version
node --version

# Rebuild application
npm run build
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U app_learn_user -h localhost -d app_learn_db -c "SELECT 1;"

# Check PostgreSQL service
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### Docker Issues

```bash
# Check container logs
docker-compose logs api

# Rebuild containers
docker-compose build --no-cache

# Restart all services
docker-compose restart

# View running containers
docker ps

# Debug container shell
docker-compose exec api sh
```

---

## Performance Optimization

### Enable Compression

Already configured in nginx.conf with gzip compression.

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_board_workspace ON boards(workspace_id);
CREATE INDEX idx_card_list ON cards(list_id);

-- Check slow queries
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### Node.js Optimization

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Configure cluster mode (already set in ecosystem.config.js)
# Automatically uses all CPU cores
```

---

## Support and Maintenance

### Regular Tasks

- **Daily**: Monitor application logs and health
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Full system review

### Emergency Contacts

- DevOps: devops@company.com
- Database Admin: dba@company.com
- Security: security@company.com

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated**: 2024-11-17
**Version**: 1.0
**Maintainer**: DevOps Team
