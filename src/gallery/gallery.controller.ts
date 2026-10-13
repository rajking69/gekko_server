import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ConflictException,
  NotFoundException,
  BadGatewayException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'node:stream';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { GalleryService } from './gallery.service.ts';
import { QueryGalleryDto } from './dto/query-gallery.dto.ts';
import { AdminQueryGalleryDto } from './dto/query-gallery.dto.ts';
import { UpdateVisibilityDto } from './dto/query-gallery.dto.ts';
import { AuthGuard } from '../auth/guards/auth.guard.ts';
import { GalleryAccessGuard } from './guards/gallery-access.guard.ts';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ==================== Public Endpoints ====================

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Proxy a public gallery thumbnail' })
  async thumbnail(@Param('id') id: string, @Res() response: Response) {
    const item = await this.galleryService.findPublicThumbnail(id);
    const rawCandidates = [
      `https://lh3.googleusercontent.com/d/${id}=s1600`,
      item?.thumbnailUrl,
      `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
    ];
    const candidates: string[] = rawCandidates.filter(
      (c): c is string => typeof c === 'string' && c.length > 0,
    );

    let upstream: globalThis.Response | null = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (res.ok && res.body) {
          upstream = res;
          break;
        }
      } catch {}
    }

    if (!upstream || !upstream.body) {
      throw new BadGatewayException('Gallery thumbnail could not be fetched');
    }

    response.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || item?.mimeType || 'image/jpeg',
    );
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]).pipe(response);
  }

  @Get()
  @ApiOperation({ summary: 'Get public gallery items with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated gallery items' })
  async list(@Query() query: QueryGalleryDto) {
    return this.galleryService.findPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single public gallery item by Drive file ID' })
  @ApiResponse({ status: 200, description: 'Gallery item details' })
  @ApiResponse({ status: 404, description: 'Item not found or not visible' })
  async getOne(@Param('id') id: string) {
    const item = await this.galleryService.findPublicById(id);
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }
    return item;
  }

  // ==================== Admin/Moderator Endpoints ====================

  @Get('admin/list')
  @UseGuards(AuthGuard, GalleryAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gallery items for admin management (requires auth)' })
  @ApiResponse({ status: 200, description: 'Paginated gallery items with admin data' })
  async listAdmin(@Query() query: AdminQueryGalleryDto) {
    return this.galleryService.findAdmin(query);
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard, GalleryAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get gallery statistics (requires auth)' })
  @ApiResponse({ status: 200, description: 'Gallery statistics' })
  async getStats() {
    return this.galleryService.getStats();
  }

  @Get('admin/sync-status')
  @UseGuards(AuthGuard, GalleryAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current synchronization status (requires auth)' })
  @ApiResponse({ status: 200, description: 'Sync status and statistics' })
  async getSyncStatus() {
    return this.galleryService.getSyncStatus();
  }

  @Post('admin/sync')
  @UseGuards(AuthGuard, GalleryAccessGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger manual gallery synchronization (requires auth)' })
  @ApiResponse({ status: 202, description: 'Sync started' })
  @ApiResponse({ status: 409, description: 'Sync already in progress' })
  async syncNow() {
    if (this.galleryService.isSyncRunning()) {
      throw new ConflictException('Synchronization already in progress');
    }

    return this.galleryService.syncNow();
  }

  @Patch('admin/:id/visibility')
  @UseGuards(AuthGuard, GalleryAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gallery item visibility (requires auth)' })
  @ApiResponse({ status: 200, description: 'Visibility updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateVisibility(@Param('id') id: string, @Body() dto: UpdateVisibilityDto) {
    const item = await this.galleryService.updateVisibility(id, dto);
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }
    return item;
  }
}