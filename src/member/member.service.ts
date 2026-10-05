import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberInterface } from '../database/schemas/member.schema.ts';
import { CreateMemberDto } from '../member/dto/create-member.dto.ts';
import { UpdateMemberDto } from '../member/dto/update-member.dto.ts';
import { UpdateMemberStatusDto } from '../member/dto/update-member-status.dto.ts';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);

  constructor(
    @InjectModel('Member') private readonly memberModel: Model<MemberInterface>,
  ) {}

  async findAll(
    pagination: { page?: number; limit?: number } = { page: 1, limit: 20 },
    filters?: {
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
      department?: string;
      batch?: string;
      search?: string;
    },
  ): Promise<{
    data: MemberInterface[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.department) {
      query.department = filters.department;
    }
    if (filters?.batch) {
      query.batch = filters.batch;
    }
    if (filters?.search) {
      query.$or = [
        { displayName: new RegExp(filters.search, 'i') },
        { username: new RegExp(filters.search, 'i') },
        { department: new RegExp(filters.search, 'i') },
      ];
    }

    const total = await this.memberModel.countDocuments(query);
    const data = await this.memberModel
      .find(query)
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MemberInterface | null> {
    return this.memberModel.findOne({ username: id }).exec();
  }

  async findByUsername(username: string): Promise<MemberInterface | null> {
    return this.memberModel.findOne({ username }).exec();
  }

  async create(createMemberDto: CreateMemberDto): Promise<MemberInterface> {
    return this.memberModel.findOneAndUpdate(
      { authUserId: createMemberDto.authUserId },
      { $set: createMemberDto },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).exec() as Promise<MemberInterface>;
  }

  async update(
    id: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<MemberInterface | null> {
    return this.memberModel.findOneAndUpdate({ username: id }, updateMemberDto, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ): Promise<MemberInterface | null> {
    return this.memberModel.findOneAndUpdate(
      { username: id },
      { status },
      { new: true, runValidators: true },
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.memberModel.deleteOne({ username: id }).exec();
    return result.deletedCount > 0;
  }
}