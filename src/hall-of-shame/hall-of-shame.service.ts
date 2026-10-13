import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HallOfShameModel, HallOfShameDocument } from './hall-of-shame.schema.ts';
import { CreateHallOfShameDto } from './dto/create-hall-of-shame.dto.ts';
import { Model } from 'mongoose';

@Injectable()
export class HallOfShameService {
  private readonly logger = new Logger(HallOfShameService.name);

  constructor(
    @InjectModel('HallOfShame')
    private readonly hallOfShameModel: Model<HallOfShameDocument>,
  ) {}

  async findAllPublished(
    featuredOnly?: boolean,
    limit?: number,
  ): Promise<HallOfShameDocument[]> {
    const query: any = { published: true };
    if (featuredOnly) {
      query.featured = true;
    }
    return this.hallOfShameModel
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit ?? 20)
      .exec();
  }

  async findAllDraft(): Promise<HallOfShameDocument[]> {
    return this.hallOfShameModel
      .find({ published: false })
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findOne(slug: string): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOne({ slug }).exec();
  }

  async findOneById(id: string): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findById(id).exec();
  }

  async create(createDto: CreateHallOfShameDto): Promise<HallOfShameDocument> {
    const created = new this.hallOfShameModel({
      ...createDto,
      published: false,
      featured: false,
      displayOrder: 0,
    });
    return created.save();
  }

  async update(slug: string, updates: Partial<CreateHallOfShameDto>): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOneAndUpdate({ slug }, updates, { returnDocument: 'after', runValidators: true }).exec();
  }

  async delete(slug: string): Promise<boolean> {
    const result = await this.hallOfShameModel.deleteOne({ slug }).exec();
    return result.deletedCount > 0;
  }

  async publish(slug: string): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOneAndUpdate(
      { slug, published: false },
      { 
        published: true,
        publishedAt: new Date(),
        $set: { displayOrder: 1 } 
      },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async unpublish(slug: string): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOneAndUpdate(
      { slug, published: true },
      { 
        published: false,
        publishedAt: undefined,
        $unset: { publishedAt: '' }
      },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async feature(slug: string, featured: boolean): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOneAndUpdate(
      { slug },
      { featured },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }

  async reorder(slug: string, displayOrder: number): Promise<HallOfShameDocument | null> {
    return this.hallOfShameModel.findOneAndUpdate(
      { slug },
      { displayOrder },
      { returnDocument: 'after', runValidators: true }
    ).exec();
  }
}
