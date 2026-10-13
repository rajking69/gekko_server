import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HallOfFameModel, HallOfFameDocument } from './hall-of-fame.schema.ts';
import { CreateHallOfFameDto } from './dto/create-hall-of-fame.dto.ts';
import { Model } from 'mongoose';

@Injectable()
export class HallOfFameService {
  private readonly logger = new Logger(HallOfFameService.name);

  constructor(
    @InjectModel('HallOfFame')
    private readonly hallOfFameModel: Model<HallOfFameDocument>,
  ) {}

  async findAllPublished(
    featuredOnly?: boolean,
    limit?: number,
  ): Promise<HallOfFameDocument[]> {
    const query: any = { published: true };
    if (featuredOnly) {
      query.featured = true;
    }
    return this.hallOfFameModel
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit ?? 20)
      .exec();
  }

  async findAllDraft(): Promise<HallOfFameDocument[]> {
    return this.hallOfFameModel
      .find({ published: false })
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findOne(slug: string): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOne({ slug }).exec();
  }

  async findOneById(id: string): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findById(id).exec();
  }

  async create(createDto: CreateHallOfFameDto): Promise<HallOfFameDocument> {
    const created = new this.hallOfFameModel({
      ...createDto,
      published: false,
      featured: false,
      displayOrder: 0,
    });
    return created.save();
  }

  async update(slug: string, updates: Partial<CreateHallOfFameDto>): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOneAndUpdate({ slug }, updates, { returnDocument: 'after', runValidators: true }).exec();
  }

  async delete(slug: string): Promise<boolean> {
    const result = await this.hallOfFameModel.deleteOne({ slug }).exec();
    return result.deletedCount > 0;
  }

  async publish(slug: string): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOneAndUpdate(
      { slug, published: false },
      { 
        published: true,
        publishedAt: new Date(),
        $set: { displayOrder: 1 } 
      },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async unpublish(slug: string): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOneAndUpdate(
      { slug, published: true },
      { 
        published: false,
        publishedAt: undefined,
        $unset: { publishedAt: '' }
      },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async feature(slug: string, featured: boolean): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOneAndUpdate(
      { slug },
      { featured },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async reorder(slug: string, displayOrder: number): Promise<HallOfFameDocument | null> {
    return this.hallOfFameModel.findOneAndUpdate(
      { slug },
      { displayOrder },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }
}
