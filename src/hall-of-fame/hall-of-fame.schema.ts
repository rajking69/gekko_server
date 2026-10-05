import { Schema, model, Document, Types } from 'mongoose';

export type HallOfFameDocument = Document & {
  title: string;
  slug: string;
  memberId?: Types.ObjectId;
  category: string;
  description: string;
  story: string;
  imageUrl: string;
  year: number;
  featured: boolean;
  published: boolean;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  displayOrder: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const hallOfFameSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    category: { 
      type: String, 
      required: true,
      enum: ['MEMBER_OF_THE_YEAR', 'BEST_CONTRIBUTOR', 'LEADERSHIP', 'TOURNAMENT_CHAMPION', 'COMMUNITY_SERVICE', 'SPECIAL_RECOGNITION', 'HISTORICAL', 'OTHER']
    },
    description: { type: String, required: true },
    story: { type: String, required: true },
    imageUrl: { type: String, required: true },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    displayOrder: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hallOfFameSchema.index({ published: 1 });
hallOfFameSchema.index({ featured: 1 });
hallOfFameSchema.index({ displayOrder: 1 });
hallOfFameSchema.index({ year: -1 });

export const HallOfFameSchema = hallOfFameSchema;

export const HallOfFameModel = model<HallOfFameDocument>("HallOfFame", hallOfFameSchema);
