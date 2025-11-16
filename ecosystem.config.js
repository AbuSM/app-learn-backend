module.exports = {
  apps: [
    {
      name: 'app-learn-api',
      script: './dist/main.js',
      cwd: '/root/app-learn-backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      // Restart policies
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Logging
      output: '/var/log/app-learn/out.log',
      error: '/var/log/app-learn/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Performance
      max_memory_restart: '500M',
      // Graceful shutdown
      kill_timeout: 30000,
      wait_ready: false,
      // Development watch mode (disabled in production)
      watch: false,
      ignore_watch: ['node_modules', 'dist/**.map'],
    },
  ],

  // Cluster mode deployment
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/app-learn-backend.git',
      path: '/home/deploy/app-learn-backend',
      'post-deploy':
        'npm install --omit=dev && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local':
        "echo 'Deploying to production server' && git push origin main",
    },
  },
};
