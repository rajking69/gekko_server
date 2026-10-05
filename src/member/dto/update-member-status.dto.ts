import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateMemberStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE', description: 'Member status' })
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}