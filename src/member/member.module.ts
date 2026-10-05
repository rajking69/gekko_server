import { Module } from '@nestjs/common';
import { MemberService } from './member.service.ts';
import { MemberController } from './member.controller.ts';
import { MemberSchema } from '../database/schemas/member.schema.ts';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateMemberDto } from './dto/create-member.dto.ts';
import { UpdateMemberDto } from './dto/update-member.dto.ts';
import { AuthModule } from '../auth/auth.module.ts';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
    AuthModule,
  ],
  providers: [MemberService],
  controllers: [MemberController],
  exports: [MemberService],
})
export class MemberModule {}