import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './event.schema.ts';
import { EventService } from './event.service.ts';
import { CreateEventDto } from './dto/create-event.dto.ts';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
