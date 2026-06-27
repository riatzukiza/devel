module.exports = {
  apps: [
    {
      name: 'pantheon-workspace-registry',
      script: './dist/registry/server.js',
      watch: false,
      env: {
        PANTHEON_REGISTRY_PORT: process.env.PANTHEON_REGISTRY_PORT || '4097',
        PANTHEON_REGISTRY_PATH:
          process.env.PANTHEON_REGISTRY_PATH ||
          `${require('os').homedir()}/.cache/pantheon/workspaces`,
      },
    },
  ],
};
