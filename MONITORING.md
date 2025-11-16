# App Learn Backend - Monitoring & Logging Setup

Comprehensive guide for monitoring, logging, and alerting in production.

## Table of Contents

1. [Log Management](#log-management)
2. [Application Monitoring](#application-monitoring)
3. [System Monitoring](#system-monitoring)
4. [Database Monitoring](#database-monitoring)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Error Tracking](#error-tracking)
7. [Performance Monitoring](#performance-monitoring)

---

## Log Management

### PM2 Logs

```bash
# View real-time logs
pm2 logs app-learn-api

# View logs with errors only
pm2 logs app-learn-api --err

# View specific line count
pm2 logs app-learn-api --lines 100

# Export logs to file
pm2 logs app-learn-api > ~/app-logs.txt
```

### System Logs

```bash
# View systemd service logs
journalctl -u app-learn-api.service -f

# View last N lines
journalctl -u app-learn-api.service -n 100

# View logs since time
journalctl -u app-learn-api.service --since "2024-01-01"

# Export to file
journalctl -u app-learn-api.service > ~/service-logs.txt
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/app-learn-access.log

# Error logs
sudo tail -f /var/log/nginx/app-learn-error.log

# View failed requests
sudo grep "error" /var/log/nginx/app-learn-error.log

# Count status codes
sudo cat /var/log/nginx/app-learn-access.log | awk '{print $9}' | sort | uniq -c
```

### Log Rotation Configuration

Create `/etc/logrotate.d/app-learn`:

```
/var/log/app-learn/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 applearn applearn
    sharedscripts
    postrotate
        pm2 reload app-learn-api > /dev/null 2>&1 || true
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/app-learn*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
```

---

## Application Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring dashboard
pm2 monit

# Get detailed process information
pm2 show app-learn-api

# Get web dashboard (requires Pro)
pm2 web
# Access at http://localhost:9615
```

### Custom Health Check Script

Create `health-check.sh`:

```bash
#!/bin/bash

# Check API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/docs)
if [ "$API_HEALTH" != "200" ]; then
    echo "API Health Check FAILED: HTTP $API_HEALTH"
    pm2 restart app-learn-api
    exit 1
fi

# Check database connection
DB_CHECK=$(curl -s http://localhost:3000/api/health | jq -r '.database' 2>/dev/null)
if [ "$DB_CHECK" != "connected" ]; then
    echo "Database Check FAILED"
    exit 1
fi

echo "All health checks passed"
exit 0
```

Run periodically with cron:

```bash
# Edit crontab
crontab -e

# Add (checks every 5 minutes)
*/5 * * * * /home/applearn/health-check.sh >> /var/log/app-learn/health-check.log 2>&1
```

---

## System Monitoring

### CPU and Memory Usage

```bash
# Real-time monitoring
top

# Display specific process
top -p $(pgrep -f "node dist/main")

# One-time snapshot
ps aux | grep node

# Memory usage per process
ps aux | head -1; ps aux | grep node | grep -v grep
```

### Disk Usage

```bash
# Check disk space
df -h

# Check inode usage
df -i

# Find large directories
du -sh /home/applearn/*

# Monitor specific directory
watch -n 1 'du -sh /var/log/app-learn'
```

### Network Monitoring

```bash
# View active connections
netstat -tuln | grep 3000

# Monitor bandwidth
iftop

# Check listening ports
ss -tuln
```

### Create System Monitor Script

Create `system-monitor.sh`:

```bash
#!/bin/bash

echo "=== System Health Report ==="
echo "Timestamp: $(date)"
echo ""

echo "CPU Usage:"
top -b -n 1 | grep "Cpu(s)"

echo ""
echo "Memory Usage:"
free -h

echo ""
echo "Disk Usage:"
df -h / | tail -1

echo ""
echo "Inode Usage:"
df -i / | tail -1

echo ""
echo "Running Processes:"
ps aux | grep "node dist/main" | grep -v grep

echo ""
echo "Network Connections on port 3000:"
netstat -tuln | grep 3000

echo ""
echo "Recent Errors (last 10):"
pm2 logs app-learn-api --err --lines 10
```

Run daily with cron:

```bash
# 6 AM daily
0 6 * * * /home/applearn/system-monitor.sh > /var/log/app-learn/system-monitor.log 2>&1
```

---

## Database Monitoring

### PostgreSQL Query Monitoring

```bash
# Connect to database
psql -U app_learn_user -d app_learn_db

# Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
SELECT pg_reload_conf();

# View slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

# View table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename))
FROM pg_tables WHERE schemaname='public'
ORDER BY pg_total_relation_size(tablename) DESC;

# View index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

# Unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Database Backup Monitoring

Create `backup-monitor.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/app-learn"
BACKUP_AGE_HOURS=25

# Find backups older than 25 hours (should be daily)
RECENT_BACKUP=$(find $BACKUP_DIR -name "*.sql.gz" -mmin -$((BACKUP_AGE_HOURS*60)) | wc -l)

if [ "$RECENT_BACKUP" -eq 0 ]; then
    echo "WARNING: No recent database backup found!"
    # Send alert email
    mail -s "Database Backup Alert" devops@company.com <<< "No backup in last 25 hours"
else
    BACKUP_FILE=$(ls -lt $BACKUP_DIR/*.sql.gz | head -1 | awk '{print $NF}')
    BACKUP_SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')
    echo "Latest backup: $BACKUP_FILE ($BACKUP_SIZE)"
fi
```

---

## Uptime Monitoring

### UptimeRobot Integration

Free uptime monitoring service:

1. Visit https://uptimerobot.com
2. Create account
3. Add monitor:
   - URL: `https://your-domain.com/api/docs`
   - Check interval: 5 minutes
   - Alert contacts: your-email@company.com

### Healthchecks.io Integration

Alternative free health check service:

```bash
# Create healthcheck.io account
# Get unique URL: https://hc-ping.com/xxxxxxxx

# Create cron job that pings on success
0 */6 * * * your-command && curl -m 10 https://hc-ping.com/xxxxxxxx
```

---

## Error Tracking

### Sentry Integration (Optional)

For advanced error tracking:

1. Install Sentry SDK:
```bash
npm install @sentry/node
```

2. Add to main.ts:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. Set environment variable:
```bash
export SENTRY_DSN=https://xxxxx@sentry.io/yyyy
```

### Local Error Tracking

Monitor application errors:

```bash
# Find all errors in logs
pm2 logs app-learn-api --err | grep -E "Error|Exception"

# Count errors
pm2 logs app-learn-api --err | grep -E "Error|Exception" | wc -l

# Monitor error rate in real-time
watch -n 5 "pm2 logs app-learn-api --lines 100 | grep -cE 'Error|Exception'"
```

---

## Performance Monitoring

### Response Time Monitoring

```bash
# Measure API response time
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/docs

# Monitor endpoint performance
ab -n 1000 -c 10 http://localhost:3000/api/

# Load test
wrk -t4 -c100 -d30s http://localhost:3000/api/
```

### Database Performance

```bash
# Monitor active connections
psql -U app_learn_user -d app_learn_db -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Monitor query performance
psql -U app_learn_user -d app_learn_db -c \
  "SELECT query, mean_time, calls FROM pg_stat_statements
   ORDER BY mean_time DESC LIMIT 10;"
```

### Node.js Memory Profiling

```bash
# Check memory usage
pm2 show app-learn-api | grep memory

# Force garbage collection (if memory grows)
pm2 kill
pm2 start ecosystem.config.js

# Enable heap snapshot
node --inspect dist/main.js
# Access at chrome://inspect
```

---

## Alert Configuration

### Email Alerts

Create `send-alert.sh`:

```bash
#!/bin/bash

RECIPIENT="devops@company.com"
SUBJECT="App Learn Alert: $1"
MESSAGE="$2"
TIMESTAMP=$(date)

# Check if process is running
if ! pgrep -f "node dist/main" > /dev/null; then
    echo "Subject: $SUBJECT
Date: $TIMESTAMP

Application process is not running!

System Status:
$(ps aux | grep node | grep -v grep || echo 'No Node processes found')

Last 20 log lines:
$(pm2 logs app-learn-api --lines 20)
" | sendmail $RECIPIENT
fi
```

### Slack Alerts (Optional)

```bash
#!/bin/bash

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_slack_alert() {
    local message="$1"
    curl -X POST $SLACK_WEBHOOK \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"⚠️ App Learn Alert: $message\"}"
}

# Usage
send_slack_alert "API is down!"
```

---

## Dashboard Setup

### Create Monitoring Dashboard

Create `dashboard.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>App Learn Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial; margin: 20px; }
        .metric { display: inline-block; padding: 20px; margin: 10px; border: 1px solid #ddd; }
        .status-ok { color: green; }
        .status-warn { color: orange; }
        .status-err { color: red; }
    </style>
</head>
<body>
    <h1>App Learn API - Monitoring Dashboard</h1>
    <div id="status"></div>
    <div id="charts"></div>

    <script>
        // Update status every 30 seconds
        setInterval(async () => {
            const response = await fetch('/api/health');
            const data = await response.json();
            document.getElementById('status').innerHTML = `
                <div class="metric">
                    <h3>API Status: <span class="status-${data.status}">${data.status}</span></h3>
                    <p>Uptime: ${data.uptime}</p>
                    <p>Memory: ${data.memory}</p>
                </div>
            `;
        }, 30000);
    </script>
</body>
</html>
```

---

## Checklist

- [ ] Setup PM2 monitoring
- [ ] Configure log rotation
- [ ] Setup system monitoring script
- [ ] Configure database backups
- [ ] Setup uptime monitoring
- [ ] Configure error tracking
- [ ] Create alert system
- [ ] Test alert notifications
- [ ] Document alert procedures
- [ ] Train team on monitoring

---

**Last Updated**: 2024-11-17
**Monitoring Interval**: Every 5 minutes
**Backup Frequency**: Daily at 2 AM
**Log Retention**: 14 days
