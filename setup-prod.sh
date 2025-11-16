#!/bin/bash

################################################################################
# App Learn Backend - Production Server Quick Setup Script
# Run this on a fresh Ubuntu 20.04+ server to setup everything
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }

################################################################################
# Main Setup
################################################################################

main() {
    log "Starting production server setup..."

    # Check if running as sudo
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root (use sudo)"
    fi

    log "Updating system packages..."
    apt update && apt upgrade -y
    success "System updated"

    log "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
    success "Node.js $(node -v) installed"

    log "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    success "PostgreSQL installed and enabled"

    log "Installing Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    success "Nginx installed and enabled"

    log "Installing PM2..."
    npm install -g pm2
    success "PM2 installed"

    log "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
    success "Certbot installed"

    log "Installing utilities..."
    apt install -y curl wget git htop vim build-essential
    success "Utilities installed"

    log "Creating application user..."
    useradd -m -s /bin/bash applearn 2>/dev/null || warning "User applearn already exists"
    usermod -aG sudo applearn
    success "Application user created"

    log "Creating log directory..."
    mkdir -p /var/log/app-learn
    chown applearn:applearn /var/log/app-learn
    chmod 755 /var/log/app-learn
    success "Log directory created"

    log "Configuring firewall..."
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    success "Firewall configured"

    log "Setting up PostgreSQL user and database..."
    sudo -u postgres createuser app_learn_user -P --no-createdb --no-createrole --no-superuser 2>/dev/null || warning "User app_learn_user already exists"
    sudo -u postgres createdb app_learn_db -O app_learn_user 2>/dev/null || warning "Database app_learn_db already exists"
    success "PostgreSQL user and database created"

    log "Creating deployment directory..."
    mkdir -p /home/applearn/app-learn-backend
    chown applearn:applearn /home/applearn/app-learn-backend
    success "Deployment directory created"

    log "Configuring systemd service..."
    # Create the systemd service file directly (it will be updated later from repo)
    cat > /etc/systemd/system/app-learn-api.service << 'SERVICEFILE'
[Unit]
Description=App Learn API Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=applearn
WorkingDirectory=/home/applearn/app-learn-backend
EnvironmentFile=/home/applearn/app-learn-backend/.env.production

# Start command using PM2
ExecStart=/usr/local/bin/pm2 start ecosystem.config.js --no-daemon

# Restart policy
Restart=on-failure
RestartSec=10s

# Graceful shutdown
KillSignal=SIGTERM
KillMode=process
TimeoutStopSec=30

# Resource limits
LimitNOFILE=65536
LimitNPROC=65536

# Process management
StandardOutput=journal
StandardError=journal
SyslogIdentifier=app-learn-api

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/log/app-learn /home/applearn/app-learn-backend

[Install]
WantedBy=multi-user.target
SERVICEFILE

    systemctl daemon-reload
    systemctl enable app-learn-api.service
    success "Systemd service configured"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Server setup completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Switch to applearn user:"
    echo "   sudo su - applearn"
    echo ""
    echo "2. Clone the repository:"
    echo "   git clone <your-repo-url> ~/app-learn-backend"
    echo ""
    echo "3. Configure environment:"
    echo "   cd ~/app-learn-backend"
    echo "   cp .env.production .env.production.local"
    echo "   nano .env.production.local  # Edit with your settings"
    echo ""
    echo "4. Install dependencies and build:"
    echo "   npm install && npm run build"
    echo ""
    echo "5. Setup PM2:"
    echo "   pm2 start ecosystem.config.js"
    echo "   pm2 startup"
    echo "   pm2 save"
    echo ""
    echo "6. Configure Nginx:"
    echo "   sudo cp nginx.conf /etc/nginx/sites-available/app-learn-api"
    echo "   sudo ln -s /etc/nginx/sites-available/app-learn-api /etc/nginx/sites-enabled/"
    echo "   sudo rm /etc/nginx/sites-enabled/default"
    echo "   sudo nginx -t && sudo systemctl reload nginx"
    echo ""
    echo "7. Setup SSL certificate:"
    echo "   sudo certbot certonly --standalone -d your-domain.com"
    echo ""
    echo "8. Verify application is running:"
    echo "   curl http://localhost:3000/api/docs"
    echo ""
}

# Run main
main
