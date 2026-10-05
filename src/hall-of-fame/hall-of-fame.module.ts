import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.ts';
import { HallOfFameSchema } from './hall-of-fame.schema.ts';
import { HallOfFameService } from './hall-of-fame.service.ts';
import { HallOfFameController } from './hall-of-fame.controller.ts';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'HallOfFame', schema: HallOfFameSchema }]),
  ],
  controllers: [HallOfFameController],
  providers: [HallOfFameService],
  exports: [HallOfFameService],
})
export class HallOfFameModule {}
