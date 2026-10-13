import { Schema, model, Document } from 'mongoose';

export type MediaType = 'image' | 'video';

export type GallerySyncStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface GalleryItemDocument extends Document {
  driveFileId: string;
  name: string;
  mimeType: string;
  mediaType: MediaType;
  createdTime: Date;
  modifiedTime: Date;
  size: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  isVisible: boolean;
  lastSyncedAt: Date;
  parents?: string[];
  folderId?: string;
}

export interface GallerySyncDocument extends Document {
  status: GallerySyncStatus;
  startedAt: Date;
  completedAt?: Date;
  totalFiles: number;
  newFiles: number;
  updatedFiles: number;
  removedFiles: number;
  error?: string;
  errorDetails?: unknown;
}

export const GalleryItemSchema = new Schema<GalleryItemDocument>(
  {
    driveFileId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true, index: true },
    createdTime: { type: Date, required: true, index: true },
    modifiedTime: { type: Date, required: true },
    size: { type: Number, required: true },
    thumbnailUrl: { type: String },
    previewUrl: { type: String },
    webViewLink: { type: String },
    thumbnailLink: { type: String },
    isVisible: { type: Boolean, default: true, index: true },
    lastSyncedAt: { type: Date, required: true, default: Date.now },
    parents: [{ type: String }],
    folderId: { type: String, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

GalleryItemSchema.index({ isVisible: 1, createdTime: -1 });
GalleryItemSchema.index({ mediaType: 1, isVisible: 1, createdTime: -1 });
GalleryItemSchema.index({ name: 'text' });

export const GallerySyncSchema = new Schema<GallerySyncDocument>(
  {
    status: { type: String, enum: ['idle', 'running', 'completed', 'failed'], default: 'idle' },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    totalFiles: { type: Number, default: 0 },
    newFiles: { type: Number, default: 0 },
    updatedFiles: { type: Number, default: 0 },
    removedFiles: { type: Number, default: 0 },
    error: { type: String },
    errorDetails: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

GallerySyncSchema.index({ status: 1 });
GallerySyncSchema.index({ startedAt: -1 });

export const GalleryItemModel = model<GalleryItemDocument>('GalleryItem', GalleryItemSchema);
export const GallerySyncModel = model<GallerySyncDocument>('GallerySync', GallerySyncSchema);