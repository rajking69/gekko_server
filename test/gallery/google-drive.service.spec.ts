import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { GoogleDriveService, type DriveFile } from '../../src/gallery/google-drive.service.ts';

describe('GoogleDriveService', () => {
  const service = new GoogleDriveService(
    new ConfigService({ googleDriveGalleryFolderId: 'gallery-folder' }),
  );

  it('normalizes image metadata without enabling direct visibility changes', () => {
    const file: DriveFile = {
      id: 'image-1',
      name: 'team-photo.jpg',
      mimeType: 'image/jpeg',
      createdTime: '2026-01-02T12:00:00.000Z',
      modifiedTime: '2026-01-03T12:00:00.000Z',
      size: '1024',
      thumbnailLink: 'https://example.test/thumb=s220',
      webViewLink: 'https://drive.google.com/file/d/image-1/view',
      parents: ['gallery-folder'],
    };

    const normalized = service.normalizeFile(file);

    expect(normalized).toMatchObject({
      driveFileId: 'image-1',
      mediaType: 'image',
      size: 1024,
      folderId: 'gallery-folder',
    });
    expect(normalized).not.toHaveProperty('isVisible');
    expect(normalized.createdTime).toEqual(new Date(file.createdTime));
  });

  it('normalizes supported videos with a Drive preview fallback', () => {
    const file: DriveFile = {
      id: 'video-1',
      name: 'match-highlight.mp4',
      mimeType: 'video/mp4',
      createdTime: '2026-02-01T12:00:00.000Z',
      modifiedTime: '2026-02-01T12:00:00.000Z',
      webViewLink: 'https://drive.google.com/file/d/video-1/view',
    };

    const normalized = service.normalizeFile(file);

    expect(normalized.mediaType).toBe('video');
    expect(normalized.previewUrl).toBe(file.webViewLink);
  });
});
