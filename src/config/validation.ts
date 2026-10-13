export function validateEnvironment(config: Record<string, unknown>) {
  const mongodbUri = config.MONGODB_URI;
  if (typeof mongodbUri !== 'string' || mongodbUri.trim() === '') {
    throw new Error('MONGODB_URI is required');
  }

  const port = Number(config.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  // Google Drive Gallery folder ID is required for gallery functionality
  const galleryFolderId = config.GOOGLE_DRIVE_GALLERY_FOLDER_ID;
  if (typeof galleryFolderId !== 'string' || galleryFolderId.trim() === '') {
    throw new Error('GOOGLE_DRIVE_GALLERY_FOLDER_ID is required for gallery synchronization');
  }

  // At least one authentication method must be configured
  const hasServiceAccount = typeof config.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY === 'string' && config.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY.trim() !== '';
  const hasServiceAccountFile = typeof config.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE === 'string' && config.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE.trim() !== '';
  const hasOAuth2 = typeof config.GOOGLE_DRIVE_CLIENT_ID === 'string' && config.GOOGLE_DRIVE_CLIENT_ID.trim() !== '' &&
                    typeof config.GOOGLE_DRIVE_CLIENT_SECRET === 'string' && config.GOOGLE_DRIVE_CLIENT_SECRET.trim() !== '' &&
                    typeof config.GOOGLE_DRIVE_REFRESH_TOKEN === 'string' && config.GOOGLE_DRIVE_REFRESH_TOKEN.trim() !== '';
  const hasApiKey = typeof config.GOOGLE_DRIVE_API_KEY === 'string' && config.GOOGLE_DRIVE_API_KEY.trim() !== '';

  if (!hasServiceAccount && !hasServiceAccountFile && !hasOAuth2 && !hasApiKey) {
    throw new Error('Google Drive authentication required: configure one of GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY, OAuth2 (GOOGLE_DRIVE_CLIENT_ID/SECRET/REFRESH_TOKEN), or GOOGLE_DRIVE_API_KEY');
  }

  return {
    ...config,
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: port,
    FRONTEND_URL: config.FRONTEND_URL ?? 'http://localhost:3000',
  };
}