import { Schema, model, Document } from 'mongoose';

export type EventDocument = Document & {
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  type: string;
  status: string;
  startAt?: string;
  endAt?: string;
  location: string;
  isOnline: boolean;
  onlineUrl?: string;
  organizer: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  capacity?: number | null;
  registered?: number;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  requirements?: string[];
  acent?: string;
  glyph?: string;
  format?: string;
};

const eventSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    type: { type: String, required: true },
    status: { type: String, required: true },
    startAt: { type: String },
    endAt: { type: String },
    location: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    onlineUrl: { type: String },
    organizer: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    capacity: { type: Number },
    registered: { type: Number, default: 0 },
    registrationRequired: { type: Boolean, default: false },
    registrationDeadline: { type: String },
    requirements: { type: [String] },
    acent: { type: String },
    glyph: { type: String },
    format: { type: String },
  },
  { timestamps: true }
);

export const EventSchema = eventSchema;

EventSchema.index({ status: 1 });
EventSchema.index({ startAt: 1 });

export const EventModel = model<EventDocument>("Event", eventSchema);
