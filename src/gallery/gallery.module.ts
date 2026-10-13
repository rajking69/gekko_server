import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.ts';
import { GalleryController } from './gallery.controller.ts';
import { GalleryService } from './gallery.service.ts';
import { GoogleDriveService } from './google-drive.service.ts';
import { GalleryItemModel, GalleryItemSchema } from './gallery.schema.ts';
import { GallerySyncModel, GallerySyncSchema } from './gallery.schema.ts';
import { GalleryAccessGuard } from './guards/gallery-access.guard.ts';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: GalleryItemModel.modelName, schema: GalleryItemSchema },
      { name: GallerySyncModel.modelName, schema: GallerySyncSchema },
    ]),
  ],
  controllers: [GalleryController],
  providers: [GalleryService, GoogleDriveService, GalleryAccessGuard],
  exports: [GalleryService, GoogleDriveService],
})
export class GalleryModule {}