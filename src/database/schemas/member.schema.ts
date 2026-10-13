import { Schema, Document } from 'mongoose';

export interface MemberInterface extends Document {
  authUserId: string;
  email: string;
  username: string;
  role: string;
  displayName: string;
  fullName: string;
  avatar: string;
  coverImage: string;
  bio: string;
  department: string;
  batch: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinedAt: Date;
  mainGames: string[];
  badges: string[];
  accent: 'gekko' | 'violet' | 'cyan' | 'pink' | 'amber';
  location: string;
  pronouns: string;
  xp: number;
  level: number;
  isVerified: boolean;
  lastActiveAt: Date;
}

const MemberSchema = new Schema(
  {
    authUserId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    username: { type: String, required: true, unique: true },
    role: { type: String, default: 'member' },
    displayName: { type: String, required: true },
    fullName: { type: String },
    avatar: { type: String },
    coverImage: { type: String },
    bio: { type: String, default: '' },
    department: { type: String },
    batch: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    joinedAt: { type: Date, default: Date.now },
    mainGames: [{ type: String }],
    badges: [{ type: String }],
    accent: { type: String },
    location: { type: String },
    pronouns: { type: String },
    xp: { type: Number },
    level: { type: Number },
    isVerified: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

MemberSchema.index({ status: 1 });
MemberSchema.index({ department: 1 });
MemberSchema.index({ batch: 1 });
MemberSchema.index({ joinedAt: -1 });

export { MemberSchema };