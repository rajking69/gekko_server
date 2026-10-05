import { Schema, model, Document, Types } from 'mongoose';

export type HallOfShameDocument = Document & {
  title: string;
  slug: string;
  category: string;
  description: string;
  story: string;
  imageUrl: string;
  year?: number;
  memberId?: Types.ObjectId;
  eventId?: Types.ObjectId;
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

const hallOfShameSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { 
      type: String, 
      required: true,
      enum: ['LEGENDARY_FAIL', 'FUNNY_MOMENT', 'EPIC_MISTAKE', 'MEMORABLE_INCIDENT', 'COMMUNITY_JOKE', 'FUNNY_AWARD', 'HISTORICAL', 'OTHER']
    },
    description: { type: String, required: true },
    story: { type: String, required: true },
    imageUrl: { type: String, required: true },
    year: { type: Number, min: 1900, max: 2100, required: false },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: false },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: false },
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

hallOfShameSchema.index({ published: 1 });
hallOfShameSchema.index({ featured: 1 });
hallOfShameSchema.index({ displayOrder: 1 });
hallOfShameSchema.index({ year: -1 });

export const HallOfShameSchema = hallOfShameSchema;

export const HallOfShameModel = model<HallOfShameDocument>("HallOfShame", hallOfShameSchema);
