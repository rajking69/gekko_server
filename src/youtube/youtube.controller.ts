import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { YoutubeService } from './youtube.service.ts';

@ApiTags('youtube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get current YouTube channel live stream status' })
  @ApiResponse({ status: 200, description: 'Live status details' })
  async getLiveStatus(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.youtubeService.getLiveStatus(forceRefresh);
  }
}
