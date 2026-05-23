module.exports = {
  apps: [
    {
      name: 'time-management',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};
