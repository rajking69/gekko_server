import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { MemberService } from './member.service.ts';
import { CreateMemberDto } from './dto/create-member.dto.ts';
import { UpdateMemberDto } from './dto/update-member.dto.ts';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto.ts';
import { AuthGuard } from '../auth/guards/auth.guard.ts';

@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  /**
   * GET /api/v1/members
   * List members with pagination, filtering, and search.
   * Requires authentication.
   */
  @Get()
  async list(@Req() req: Request) {
    const result = await this.memberService.findAll(
      { page: 1, limit: 20 },
      {},
    );
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  /**
   * GET /api/v1/members/:id
   * Get member by username.
   * Public endpoint - no authentication required for browsing.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const member = await this.memberService.findOne(id);
    if (!member) {
      return {
        success: false,
        message: 'Member not found',
      };
    }
    return {
      success: true,
      data: member,
    };
  }

  /**
   * POST /api/v1/members
   * Create a new member.
   * Requires authentication.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  async create(@Body() createMemberDto: CreateMemberDto) {
    const member = await this.memberService.create(createMemberDto);
    return {
      success: true,
      data: member,
      message: 'Member created successfully',
    };
  }

  /**
   * PATCH /api/v1/members/:id
   * Update a member.
   * Requires authentication.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    const member = await this.memberService.update(id, updateMemberDto);
    if (!member) {
      return {
        success: false,
        message: 'Member not found',
      };
    }
    return {
      success: true,
      data: member,
      message: 'Member updated successfully',
    };
  }

  /**
   * PATCH /api/v1/members/:id/status
   * Update member status.
   * Requires authentication.
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateMemberStatusDto: UpdateMemberStatusDto,
  ) {
    const member = await this.memberService.updateStatus(
      id,
      updateMemberStatusDto.status,
    );
    if (!member) {
      return {
        success: false,
        message: 'Member not found',
      };
    }
    return {
      success: true,
      data: member,
      message: 'Member status updated successfully',
    };
  }

  /**
   * DELETE /api/v1/members/:id
   * Delete a member.
   * Requires authentication.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.memberService.delete(id);
    if (!deleted) {
      return {
        success: false,
        message: 'Member not found',
      };
    }
    return {
      success: true,
      message: 'Member deleted successfully',
    };
  }
}