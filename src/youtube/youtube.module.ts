import { Module } from '@nestjs/common';
import { YoutubeService } from './youtube.service.ts';
import { YoutubeController } from './youtube.controller.ts';

@Module({
  controllers: [YoutubeController],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
