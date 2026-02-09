export default () => ({
  port: 3000,
  nodeEnv: 'development',
  database: {
    url: 'postgresql://inventory_user:inventory_pass@postgres:5432/inventory_scis',
  },
  jwt: {
    secret: 'default-secret-change-me',
    accessTtl: '15m',
    refreshTtl: '7d',
  },
  cors: {
    origin: 'http://localhost:5173',
  },
  throttle: {
    ttl: 60,
    limit: 100,
  },
});
