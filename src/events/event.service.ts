import { Injectable, Logger } from '@nestjs/common';
import { EventModel, EventDocument } from './event.schema.ts';
import { CreateEventDto } from './dto/create-event.dto.ts';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  async findAll(
    status?: string,
  ): Promise<EventDocument[]> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    return EventModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(slug: string): Promise<EventDocument | null> {
    return EventModel.findOne({ slug }).exec();
  }

  async create(createEventDto: CreateEventDto): Promise<EventDocument> {
    const created = new EventModel({
      ...createEventDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return created.save();
  }

  async update(slug: string, updates: Partial<CreateEventDto>): Promise<EventDocument | null> {
    return EventModel.findOneAndUpdate({ slug }, updates, { new: true, runValidators: true }).exec();
  }

  async delete(slug: string): Promise<boolean> {
    const result = await EventModel.deleteOne({ slug }).exec();
    return result.deletedCount > 0;
  }

  async updateStatus(slug: string, status: string): Promise<EventDocument | null> {
    return EventModel.findOneAndUpdate({ slug }, { status }, { new: true, runValidators: true }).exec();
  }
}
