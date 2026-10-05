import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.ts';
import { HallOfShameSchema } from './hall-of-shame.schema.ts';
import { HallOfShameService } from './hall-of-shame.service.ts';
import { HallOfShameController } from './hall-of-shame.controller.ts';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'HallOfShame', schema: HallOfShameSchema }]),
  ],
  controllers: [HallOfShameController],
  providers: [HallOfShameService],
  exports: [HallOfShameService],
})
export class HallOfShameModule {}
