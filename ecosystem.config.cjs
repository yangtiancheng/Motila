module.exports = {
  apps: [
    {
      name: 'motila-backend',
      cwd: '/home/ubuntu/.openclaw/workspace/Motila',
      script: 'npm',
      args: '--prefix backend run start',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'motila-frontend',
      cwd: '/home/ubuntu/.openclaw/workspace/Motila',
      script: 'npm',
      args: '--prefix frontend run dev -- --host 0.0.0.0 --port 5173',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
