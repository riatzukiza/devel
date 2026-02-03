module.exports = {
  apps: [{
    name: 'cephalon',
    script: './dist/main.js',
    cwd: '/home/err/devel/services/cephalon',
    env: {
      NODE_ENV: 'production'
    },
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/cephalon-error.log',
    out_file: './logs/cephalon-out.log',
    merge_logs: true,
    kill_timeout: 5000
  }]
};
