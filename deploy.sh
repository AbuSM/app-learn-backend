#!/bin/bash

################################################################################
# App Learn Backend - Production Deployment Script
# This script handles the complete deployment process
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="app-learn-api"
PROJECT_PATH="/home/deploy/app-learn-backend"
LOG_FILE="/var/log/app-learn/deploy.log"
BACKUP_DIR="/backups/app-learn"
NODE_VERSION="18.0.0"

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

################################################################################
# Pre-deployment Checks
################################################################################

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    success "Node.js $(node -v) found"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed"
        exit 1
    fi
    success "PM2 found"

    # Check if PostgreSQL is accessible
    if ! psql -U "$DB_USERNAME" -h "$DB_HOST" -d "$DB_DATABASE" -c "\q" 2>/dev/null; then
        error "Cannot connect to PostgreSQL database"
        exit 1
    fi
    success "PostgreSQL database connection verified"

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
        exit 1
    fi
    success "Git found"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log "Creating backup..."

    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    mkdir -p "$BACKUP_PATH"

    # Backup database
    log "Backing up database..."
    pg_dump -U "$DB_USERNAME" -h "$DB_HOST" "$DB_DATABASE" | gzip > "$BACKUP_PATH/database.sql.gz"
    success "Database backed up"

    # Backup current application
    if [ -d "$PROJECT_PATH/dist" ]; then
        log "Backing up application files..."
        tar -czf "$BACKUP_PATH/app.tar.gz" -C "$PROJECT_PATH" dist node_modules package.json package-lock.json
        success "Application files backed up"
    fi

    log "Backup created at: $BACKUP_PATH"
}

################################################################################
# Git Operations
################################################################################

pull_latest_code() {
    log "Pulling latest code from repository..."

    cd "$PROJECT_PATH"

    # Stash any local changes
    git stash || true

    # Pull latest code
    git pull origin main --ff-only

    success "Code pulled successfully"
}

################################################################################
# Build Functions
################################################################################

install_dependencies() {
    log "Installing dependencies..."

    cd "$PROJECT_PATH"

    npm ci --omit=dev

    success "Dependencies installed"
}

build_application() {
    log "Building application..."

    cd "$PROJECT_PATH"

    npm run build

    success "Application built successfully"
}

run_database_migrations() {
    log "Running database migrations..."

    cd "$PROJECT_PATH"

    # TypeORM handles migrations automatically with synchronize: true
    # If using explicit migrations, run them here
    # npm run migration:run

    success "Database migrations completed"
}

################################################################################
# Testing Functions
################################################################################

run_tests() {
    log "Running tests..."

    cd "$PROJECT_PATH"

    npm test -- --passWithNoTests

    success "Tests passed"
}

################################################################################
# Deployment Functions
################################################################################

stop_application() {
    log "Stopping application..."

    pm2 stop "$PROJECT_NAME" || true

    success "Application stopped"
}

start_application() {
    log "Starting application..."

    cd "$PROJECT_PATH"

    pm2 start ecosystem.config.js

    pm2 save

    success "Application started"
}

restart_application() {
    log "Restarting application..."

    pm2 restart "$PROJECT_NAME"

    pm2 save

    success "Application restarted"
}

reload_application() {
    log "Reloading application with zero downtime..."

    pm2 reload "$PROJECT_NAME"

    pm2 save

    success "Application reloaded"
}

################################################################################
# Health Check
################################################################################

health_check() {
    log "Performing health checks..."

    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:3000/api/docs > /dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi

        warning "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 2
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
    return 1
}

################################################################################
# Rollback Function
################################################################################

rollback() {
    error "Deployment failed, rolling back..."

    if [ -z "$BACKUP_NAME" ]; then
        error "No backup found to rollback"
        return 1
    fi

    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    log "Restoring from backup: $BACKUP_NAME"

    # Restore application files
    cd "$PROJECT_PATH"
    rm -rf dist node_modules

    tar -xzf "$BACKUP_PATH/app.tar.gz" -C "$PROJECT_PATH"

    success "Application files restored"

    # Restart application
    restart_application

    success "Rollback completed successfully"
}

################################################################################
# Cleanup
################################################################################

cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 5)..."

    cd "$BACKUP_DIR"

    ls -t | tail -n +6 | xargs -r rm -rf

    success "Old backups cleaned up"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    log "=========================================="
    log "Starting deployment of $PROJECT_NAME"
    log "=========================================="

    # Load environment variables
    if [ -f "$PROJECT_PATH/.env.production" ]; then
        source "$PROJECT_PATH/.env.production"
    else
        error ".env.production file not found"
        exit 1
    fi

    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"

    # Run deployment steps
    check_prerequisites || exit 1
    create_backup || exit 1
    pull_latest_code || exit 1
    install_dependencies || exit 1
    build_application || exit 1
    run_database_migrations || exit 1
    run_tests || exit 1

    stop_application || true
    start_application || { rollback; exit 1; }

    sleep 5

    health_check || { rollback; exit 1; }

    cleanup_old_backups || true

    log "=========================================="
    success "Deployment completed successfully!"
    log "=========================================="
}

# Show usage
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [--help] [--rollback]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --rollback      Rollback to previous deployment"
    exit 0
fi

# Handle rollback
if [ "$1" == "--rollback" ]; then
    log "Rollback requested"
    rollback
    exit $?
fi

# Run main deployment
main
