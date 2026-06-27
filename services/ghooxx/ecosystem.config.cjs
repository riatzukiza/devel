const path = require("node:path");

const serviceRoot = __dirname;
const repoRoot = path.resolve(serviceRoot, "..", "..", "orgs", "open-hax", "ghooxx");

module.exports = {
  apps: [
    {
      name: "ghooxx-receiver",
      script: path.join(repoRoot, "dist", "server.cjs"),
      cwd: repoRoot,
      env: {
        NODE_ENV: "production",
        GHOOXX_HOST: "127.0.0.1",
        GHOOXX_PORT: "7999",
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      time: true,
      kill_timeout: 5000,
      watch: false,
    },
  ],
};
