export function validateEnvironment(config: Record<string, unknown>) {
  const mongodbUri = config.MONGODB_URI;
  if (typeof mongodbUri !== 'string' || mongodbUri.trim() === '') {
    throw new Error('MONGODB_URI is required');
  }

  const port = Number(config.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  return {
    ...config,
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: port,
    FRONTEND_URL: config.FRONTEND_URL ?? 'http://localhost:3000',
  };
}