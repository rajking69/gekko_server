import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'node:fs/promises';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: drive_v3.Drive;
  private oauth2Client: OAuth2Client;
  private readonly folderId: string;

  // Supported MIME types for gallery
  private readonly supportedImageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
  ];

  private readonly supportedVideoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/mpeg',
    'video/3gpp',
    'video/3gpp2',
  ];

  constructor(private readonly configService: ConfigService) {
    this.folderId = this.configService.getOrThrow<string>('googleDriveGalleryFolderId');
  }

  async onModuleInit() {
    await this.initializeAuth();
  }

  private async initializeAuth() {
    const clientId = this.configService.get<string>('googleDriveClientId');
    const clientSecret = this.configService.get<string>('googleDriveClientSecret');
    const refreshToken = this.configService.get<string>('googleDriveRefreshToken');
    const serviceAccountKey = this.configService.get<string>('googleDriveServiceAccountKey');
    const serviceAccountKeyFile = this.configService.get<string>('googleDriveServiceAccountKeyFile');

    this.oauth2Client = new OAuth2Client(clientId, clientSecret);

    if (serviceAccountKey || serviceAccountKeyFile) {
      // Service account authentication
      try {
        const rawKey = serviceAccountKeyFile
          ? await readFile(serviceAccountKeyFile, 'utf8')
          : serviceAccountKey;
        const key = JSON.parse(rawKey!);
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
          credentials: key,
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        this.logger.log('Google Drive service account authenticated');
        return;
      } catch (error) {
        this.logger.error('Failed to parse service account key', error);
      }
    }

    if (refreshToken) {
      // OAuth2 with refresh token
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      this.logger.log('Google Drive OAuth2 authenticated with refresh token');
      return;
    }

    if (clientId && clientSecret) {
      // OAuth2 client credentials (requires manual token exchange first)
      this.logger.warn('Google Drive OAuth2 client credentials configured but no refresh token. Run token exchange first.');
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      return;
    }

    // Fallback to API key for public folders (limited functionality)
    const apiKey = this.configService.get<string>('googleDriveApiKey');
    if (apiKey) {
      this.drive = google.drive({ version: 'v3', auth: apiKey });
      this.logger.log('Google Drive API key configured (public access only)');
      return;
    }

    this.logger.warn('No Google Drive authentication configured. Gallery sync will fail.');
    this.drive = google.drive({ version: 'v3' });
  }

  private isSupportedImage(mimeType: string): boolean {
    return this.supportedImageMimeTypes.includes(mimeType);
  }

  private isSupportedVideo(mimeType: string): boolean {
    return this.supportedVideoMimeTypes.includes(mimeType);
  }

  private isSupportedFile(mimeType: string): boolean {
    return this.isSupportedImage(mimeType) || this.isSupportedVideo(mimeType);
  }

  private getMediaType(mimeType: string): 'image' | 'video' | null {
    if (this.isSupportedImage(mimeType)) return 'image';
    if (this.isSupportedVideo(mimeType)) return 'video';
    return null;
  }

  /**
   * Build thumbnail URL for a file.
   * For images: use the Drive thumbnail link with larger size parameter.
   * For videos: use the Drive video thumbnail if available.
   */
  private buildThumbnailUrl(file: DriveFile): string | undefined {
    if (!file.thumbnailLink) return undefined;

    // For images, request larger thumbnail (s1600 = 1600px max dimension)
    if (this.isSupportedImage(file.mimeType)) {
      return file.thumbnailLink.replace(/=s\d+/, '=s1600');
    }

    // For videos, use the standard thumbnail
    return file.thumbnailLink;
  }

  /**
   * Build preview URL for a file.
   * For images: direct link to the file (requires appropriate sharing).
   * For videos: webViewLink to Drive preview page.
   */
  private buildPreviewUrl(file: DriveFile): string | undefined {
    if (this.isSupportedImage(file.mimeType)) {
      // Direct image link - works if file is publicly accessible
      return `https://drive.google.com/uc?export=view&id=${file.id}`;
    }

    if (this.isSupportedVideo(file.mimeType)) {
      // Video preview via Drive web view
      return file.webViewLink;
    }

    return file.webViewLink;
  }

  /**
   * List all supported files in the configured folder (including subfolders).
   * Handles pagination automatically.
   */
  async listAllFiles(): Promise<DriveFile[]> {
    if (!this.drive) {
      throw new Error('Google Drive client not initialized');
    }

    const allFiles: DriveFile[] = [];
    let pageToken: string | undefined;

    // Query for files in the folder (not trashed) with supported MIME types
    // We fetch all files in the folder tree and filter by MIME type afterward
    // because Drive API doesn't support OR in MIME type queries efficiently
    const query = `'${this.folderId}' in parents and trashed = false`;

    do {
      try {
        const response = await this.drive.files.list({
          q: query,
          pageSize: 1000,
          pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink, parents)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const files = response.data.files as DriveFile[] | undefined;
        if (files?.length) {
          const supportedFiles = files.filter((f) => this.isSupportedFile(f.mimeType));
          allFiles.push(...supportedFiles);
        }

        pageToken = response.data.nextPageToken ?? undefined;
      } catch (error) {
        this.logger.error('Failed to list Drive files', error);
        throw error;
      }
    } while (pageToken);

    // Also check subfolders recursively
    const subfolders = await this.getSubfolders(this.folderId);
    const directSubfolders = subfolders.slice();
    for (const subfolder of directSubfolders) {
      const subfolderFiles = await this.listFilesInFolder(subfolder.id);
      allFiles.push(...subfolderFiles);
    }

    return [...new Map(allFiles.map((file) => [file.id, file])).values()];
  }

  /**
   * List supported files in a specific folder.
   */
  private async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;
    const query = `'${folderId}' in parents and trashed = false`;

    do {
      try {
        const response = await this.drive.files.list({
          q: query,
          pageSize: 1000,
          pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink, parents)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const folderFiles = response.data.files as DriveFile[] | undefined;
        if (folderFiles?.length) {
          const supportedFiles = folderFiles.filter((f) => this.isSupportedFile(f.mimeType));
          files.push(...supportedFiles);
        }

        pageToken = response.data.nextPageToken ?? undefined;
      } catch (error) {
        this.logger.error(`Failed to list files in folder ${folderId}`, error);
        throw error;
      }
    } while (pageToken);

    // Recursively get subfolders
    const subfolders = await this.getSubfolders(folderId);
    for (const subfolder of subfolders) {
      const subfolderFiles = await this.listFilesInFolder(subfolder.id);
      files.push(...subfolderFiles);
    }

    return files;
  }

  /**
   * Get all subfolders recursively.
   */
  private async getSubfolders(folderId: string): Promise<DriveFile[]> {
    const subfolders: DriveFile[] = [];
    let pageToken: string | undefined;
    const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    do {
      try {
        const response = await this.drive.files.list({
          q: query,
          pageSize: 1000,
          pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, parents)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const folders = response.data.files as DriveFile[] | undefined;
        if (folders?.length) {
          subfolders.push(...folders);
        }

        pageToken = response.data.nextPageToken ?? undefined;
      } catch (error) {
        this.logger.error(`Failed to list subfolders in ${folderId}`, error);
        throw error;
      }
    } while (pageToken);

    // Recursively get nested subfolders
    for (const subfolder of subfolders) {
      const nested = await this.getSubfolders(subfolder.id);
      subfolders.push(...nested);
    }

    return subfolders;
  }

  /**
   * Get a single file by ID.
   */
  async getFile(fileId: string): Promise<DriveFile | null> {
    if (!this.drive) {
      throw new Error('Google Drive client not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size, thumbnailLink, webViewLink, parents',
        supportsAllDrives: true,
      });

      return response.data as DriveFile;
    } catch (error) {
      const driveError = error as { code?: number; response?: { data?: { error?: { message?: string } } } };
      if (driveError.code === 404 || driveError.response?.data?.error?.message?.includes('not found')) {
        return null;
      }
      this.logger.error(`Failed to get file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Normalize a Drive file to our gallery item format.
   */
  normalizeFile(file: DriveFile): {
    driveFileId: string;
    name: string;
    mimeType: string;
    mediaType: 'image' | 'video';
    createdTime: Date;
    modifiedTime: Date;
    size: number;
    thumbnailUrl?: string;
    previewUrl?: string;
    webViewLink?: string;
    thumbnailLink?: string;
    lastSyncedAt: Date;
    parents?: string[];
    folderId?: string;
  } {
    const mediaType = this.getMediaType(file.mimeType)!;

    return {
      driveFileId: file.id,
      name: file.name,
      mimeType: file.mimeType,
      mediaType,
      createdTime: new Date(file.createdTime),
      modifiedTime: new Date(file.modifiedTime),
      size: file.size ? parseInt(file.size, 10) : 0,
      thumbnailUrl: this.buildThumbnailUrl(file),
      previewUrl: this.buildPreviewUrl(file),
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      lastSyncedAt: new Date(),
      parents: file.parents,
      folderId: file.parents?.[0],
    };
  }

  /**
   * Check if the Drive API is accessible.
   */
  async checkAccess(): Promise<{ accessible: boolean; error?: string }> {
    if (!this.drive) {
      return { accessible: false, error: 'Drive client not initialized' };
    }

    try {
      await this.drive.files.get({
        fileId: this.folderId,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      return { accessible: true };
    } catch (error) {
      const driveError = error as { code?: number; message?: string; response?: { data?: { error?: { message?: string } } } };
      let errorMessage = 'Unknown error';

      if (driveError.code === 403) {
        errorMessage = 'Access denied. Check folder sharing permissions and API scopes.';
      } else if (driveError.code === 404) {
        errorMessage = 'Folder not found. Check GOOGLE_DRIVE_GALLERY_FOLDER_ID.';
      } else if (driveError.message) {
        errorMessage = driveError.message;
      } else if (driveError.response?.data?.error?.message) {
        errorMessage = driveError.response.data.error.message;
      }

      this.logger.error('Drive access check failed', errorMessage);
      return { accessible: false, error: errorMessage };
    }
  }

  getFolderId(): string {
    return this.folderId;
  }
}