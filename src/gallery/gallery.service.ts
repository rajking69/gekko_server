import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleDriveService, DriveFile } from './google-drive.service.ts';
import { GalleryItemModel, GalleryItemDocument } from './gallery.schema.ts';
import { GallerySyncModel, GallerySyncDocument } from './gallery.schema.ts';
import { QueryGalleryDto, MediaTypeFilter, AdminQueryGalleryDto } from './dto/query-gallery.dto.ts';
import { UpdateVisibilityDto } from './dto/query-gallery.dto.ts';

@Injectable()
export class GalleryService implements OnModuleInit {
  private readonly logger = new Logger(GalleryService.name);
  private syncInProgress = false;

  constructor(
    @InjectModel(GalleryItemModel.modelName) private readonly galleryItemModel: Model<GalleryItemDocument>,
    @InjectModel(GallerySyncModel.modelName) private readonly gallerySyncModel: Model<GallerySyncDocument>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncNow();
    } catch (error) {
      this.logger.error('Initial gallery sync failed; the manual sync endpoint remains available', error);
    }
  }

  /**
   * Public gallery listing with pagination and filters.
   */
  async findPublic(query: QueryGalleryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 16;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isVisible: true };

    if (query.mediaType && query.mediaType !== MediaTypeFilter.ALL) {
      filter.mediaType = query.mediaType;
    }

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const sort: Record<string, 1 | -1> = { createdTime: -1, _id: -1 };
    if (query.sort === 'oldest') {
      sort.createdTime = 1;
    } else if (query.sort === 'name') {
      sort.name = 1;
      sort._id = -1;
    }

    const [data, total] = await Promise.all([
      this.galleryItemModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      this.galleryItemModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data.map((item) => this.mapToPublicResponse(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin gallery listing with extended filters.
   */
  async findAdmin(query: AdminQueryGalleryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.mediaType && query.mediaType !== MediaTypeFilter.ALL) {
      filter.mediaType = query.mediaType;
    }

    if (typeof query.isVisible === 'boolean') {
      filter.isVisible = query.isVisible;
    }

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const sort: Record<string, 1 | -1> = { createdTime: -1, _id: -1 };
    if (query.sort === 'oldest') {
      sort.createdTime = 1;
    } else if (query.sort === 'name') {
      sort.name = 1;
      sort._id = -1;
    }

    const [data, total] = await Promise.all([
      this.galleryItemModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      this.galleryItemModel.countDocuments(filter).exec(),
    ]);

    let syncStatus = null;
    if (query.includeSyncStatus) {
      syncStatus = await this.getSyncStatus();
    }

    return {
      data: data.map((item) => this.mapToAdminResponse(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      syncStatus,
    };
  }

  /**
   * Get a single public gallery item by driveFileId.
   */
  async findPublicById(driveFileId: string) {
    const item = await this.galleryItemModel.findOne({ driveFileId, isVisible: true }).lean().exec();
    if (!item) return null;
    return this.mapToPublicResponse(item);
  }

  async findPublicThumbnail(driveFileId: string) {
    return this.galleryItemModel
      .findOne({ driveFileId, isVisible: true })
      .select('thumbnailUrl mimeType')
      .lean()
      .exec();
  }

  /**
   * Get a single gallery item by driveFileId (admin).
   */
  async findById(driveFileId: string) {
    const item = await this.galleryItemModel.findOne({ driveFileId }).lean().exec();
    if (!item) return null;
    return this.mapToAdminResponse(item);
  }

  /**
   * Update visibility of a gallery item.
   */
  async updateVisibility(driveFileId: string, dto: UpdateVisibilityDto) {
    const item = await this.galleryItemModel
      .findOneAndUpdate(
        { driveFileId },
        { isVisible: dto.isVisible },
        { returnDocument: 'after', runValidators: true }
      )
      .lean()
      .exec();

    if (!item) return null;
    return this.mapToAdminResponse(item);
  }

  /**
   * Trigger manual synchronization.
   */
  async syncNow(): Promise<GallerySyncDocument> {
    if (this.syncInProgress) {
      this.logger.warn('Sync already in progress, skipping');
      const existing = await this.gallerySyncModel
        .findOne({ status: 'running' })
        .sort({ startedAt: -1 })
        .lean()
        .exec();
      if (existing) return existing;
    }

    this.syncInProgress = true;

    const syncRecord = await this.gallerySyncModel.create({
      status: 'running',
      startedAt: new Date(),
      totalFiles: 0,
      newFiles: 0,
      updatedFiles: 0,
      removedFiles: 0,
    });

    try {
      this.logger.log('Starting Google Drive gallery synchronization');

      // Check access first
      const access = await this.googleDriveService.checkAccess();
      if (!access.accessible) {
        throw new Error(`Drive access failed: ${access.error}`);
      }

      // List all files from Drive
      const driveFiles = await this.googleDriveService.listAllFiles();
      this.logger.log(`Found ${driveFiles.length} supported files in Drive`);

      // Get existing driveFileIds from DB
      const existingIds = await this.galleryItemModel.distinct('driveFileId').exec();
      const existingIdSet = new Set(existingIds);

      const driveFileIds = new Set(driveFiles.map((f: DriveFile) => f.id));

      let newFiles = 0;
      let updatedFiles = 0;

      // Upsert new and updated files
      for (const file of driveFiles) {
        const normalized = this.googleDriveService.normalizeFile(file);
        const existing = existingIdSet.has(file.id);

        await this.galleryItemModel.findOneAndUpdate(
          { driveFileId: file.id },
          { $set: normalized },
          {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        ).exec();

        if (existing) {
          updatedFiles++;
        } else {
          newFiles++;
        }
      }

      // Handle removed/trashed files - mark as not visible instead of deleting
      // This preserves manual visibility settings and avoids data loss on temporary API failures
      const removedIds = existingIds.filter((id) => !driveFileIds.has(id));
      let removedFiles = 0;

      if (removedIds.length > 0) {
        // Only mark as not visible if they were previously synced successfully
        // and not manually hidden by admin
        const result = await this.galleryItemModel
          .updateMany(
            {
              driveFileId: { $in: removedIds },
              isVisible: true, // Only hide visible items
            },
            { $set: { isVisible: false } }
          )
          .exec();

        removedFiles = result.modifiedCount;
        this.logger.log(`Marked ${removedFiles} removed/trashed files as hidden`);
      }

      // Update sync record
      await this.gallerySyncModel.findByIdAndUpdate(
        syncRecord._id,
        {
          status: 'completed',
          completedAt: new Date(),
          totalFiles: driveFiles.length,
          newFiles,
          updatedFiles,
          removedFiles,
        },
        { returnDocument: 'after' }
      ).exec();

      this.logger.log(`Sync completed: ${newFiles} new, ${updatedFiles} updated, ${removedFiles} removed`);
    } catch (error) {
      this.logger.error('Sync failed', error);

      await this.gallerySyncModel.findByIdAndUpdate(
        syncRecord._id,
        {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          errorDetails: error instanceof Error ? { stack: error.stack } : error,
        }
      ).exec();

      throw error;
    } finally {
      this.syncInProgress = false;
    }

    return this.gallerySyncModel.findById(syncRecord._id).lean().exec() as Promise<GallerySyncDocument>;
  }

  /**
   * Get current sync status.
   */
  async getSyncStatus() {
    const latestSync = await this.gallerySyncModel
      .findOne()
      .sort({ startedAt: -1 })
      .lean()
      .exec();

    const counts = await this.galleryItemModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          images: { $sum: { $cond: [{ $eq: ['$mediaType', 'image'] }, 1, 0] } },
          videos: { $sum: { $cond: [{ $eq: ['$mediaType', 'video'] }, 1, 0] } },
          visible: { $sum: { $cond: ['$isVisible', 1, 0] } },
        },
      },
    ]).exec();

    const stats = counts[0] || { total: 0, images: 0, videos: 0, visible: 0 };

    return {
      ...latestSync,
      stats,
    };
  }

  /**
   * Get gallery statistics.
   */
  async getStats() {
    const counts = await this.galleryItemModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          images: { $sum: { $cond: [{ $eq: ['$mediaType', 'image'] }, 1, 0] } },
          videos: { $sum: { $cond: [{ $eq: ['$mediaType', 'video'] }, 1, 0] } },
          visible: { $sum: { $cond: ['$isVisible', 1, 0] } },
        },
      },
    ]).exec();

    const latestSync = await this.gallerySyncModel
      .findOne()
      .sort({ startedAt: -1 })
      .select('status completedAt startedAt totalFiles newFiles updatedFiles removedFiles error')
      .lean()
      .exec();

    return {
      ...counts[0],
      total: counts[0]?.total ?? 0,
      images: counts[0]?.images ?? 0,
      videos: counts[0]?.videos ?? 0,
      visible: counts[0]?.visible ?? 0,
      lastSync: latestSync,
    };
  }

  /**
   * Check if sync is currently running.
   */
  isSyncRunning(): boolean {
    return this.syncInProgress;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync(): Promise<void> {
    if (this.syncInProgress) {
      this.logger.warn('Scheduled gallery sync skipped because another sync is running');
      return;
    }

    try {
      await this.syncNow();
    } catch (error) {
      this.logger.error('Scheduled gallery sync failed', error);
    }
  }

  private mapToPublicResponse(item: GalleryItemDocument) {
    return {
      id: item.driveFileId,
      name: item.name,
      mimeType: item.mimeType,
      mediaType: item.mediaType,
      createdTime: item.createdTime,
      modifiedTime: item.modifiedTime,
      size: item.size,
      thumbnailUrl: item.thumbnailUrl,
      previewUrl: item.previewUrl,
      webViewLink: item.webViewLink,
      aspect: this.estimateAspectRatio(item.mimeType, item.name),
    };
  }

  private mapToAdminResponse(item: GalleryItemDocument) {
    return {
      id: item.driveFileId,
      name: item.name,
      mimeType: item.mimeType,
      mediaType: item.mediaType,
      createdTime: item.createdTime,
      modifiedTime: item.modifiedTime,
      size: item.size,
      thumbnailUrl: item.thumbnailUrl,
      previewUrl: item.previewUrl,
      webViewLink: item.webViewLink,
      isVisible: item.isVisible,
      lastSyncedAt: item.lastSyncedAt,
      aspect: this.estimateAspectRatio(item.mimeType, item.name),
    };
  }

  private estimateAspectRatio(mimeType: string, name: string): number {
    // Default aspect ratios based on common formats
    if (mimeType.startsWith('video/')) return 16 / 9;
    if (mimeType === 'image/svg+xml') return 16 / 9;

    // Try to guess from filename
    const lowerName = name.toLowerCase();
    if (lowerName.includes('portrait') || lowerName.includes('vertical')) return 9 / 16;
    if (lowerName.includes('square')) return 1;
    if (lowerName.includes('ultrawide') || lowerName.includes('21:9')) return 21 / 9;

    return 16 / 9; // Default
  }
}