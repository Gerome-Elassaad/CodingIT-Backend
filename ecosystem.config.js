// PM2 Configuration for Production Deployment
module.exports = {
  apps: [
    {
      name: 'codinit-backend',
      script: 'dist/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Logging
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart configuration
      watch: false, // Disable in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',

      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      wait_ready: true,

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Source map support
      source_map_support: true,

      // Instance variables
      instance_var: 'INSTANCE_ID',
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/codinit-backend.git',
      path: '/var/www/codinit-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
  },
};