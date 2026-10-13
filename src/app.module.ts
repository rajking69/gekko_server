import { YoutubeModule } from './youtube/youtube.module.ts';
import { Module } from '@nestjs/common';
import { EventModule } from "./events/event.module.ts";
import { HallOfFameModule } from "./hall-of-fame/hall-of-fame.module.ts";
import { HallOfShameModule } from "./hall-of-shame/hall-of-shame.module.ts";
import { GalleryModule } from "./gallery/gallery.module.ts";
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.ts';
import { MemberModule } from './member/member.module.ts';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.ts';
import configuration from './config/configuration.js';
import { validateEnvironment } from './config/validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    MemberModule,
    EventModule,
    HallOfFameModule,
    HallOfShameModule,
    GalleryModule,
    YoutubeModule,
    ThrottlerModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
