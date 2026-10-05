export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
});