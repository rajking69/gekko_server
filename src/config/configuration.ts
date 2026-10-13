export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  adminWhitelistEmails: process.env.ADMIN_WHITELIST_EMAILS,
  galleryModeratorEmails: process.env.GALLERY_MODERATOR_EMAILS,

  // Google Drive Gallery
  googleDriveGalleryFolderId: process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID,
  googleDriveServiceAccountKey: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY,
  googleDriveServiceAccountKeyFile: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE,
  googleDriveClientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
  googleDriveClientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  googleDriveRefreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  googleDriveApiKey: process.env.GOOGLE_DRIVE_API_KEY,

  // Better Auth (Google OAuth)
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
});