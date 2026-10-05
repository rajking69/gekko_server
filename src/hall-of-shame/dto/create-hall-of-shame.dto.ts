import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDate, IsMongoId, IsArray, Min, Max } from 'class-validator';

export class CreateHallOfShameDto {
  @ApiProperty({ example: 'legendary-fail-2025', description: 'Unique slug' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Legendary Fail 2025', description: 'Recognition title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'LEGENDARY_FAIL', description: 'Category' })
  @IsEnum(['LEGENDARY_FAIL', 'FUNNY_MOMENT', 'EPIC_MISTAKE', 'MEMORABLE_INCIDENT', 'COMMUNITY_JOKE', 'FUNNY_AWARD', 'HISTORICAL', 'OTHER'])
  category: 'LEGENDARY_FAIL' | 'FUNNY_MOMENT' | 'EPIC_MISTAKE' | 'MEMORABLE_INCIDENT' | 'COMMUNITY_JOKE' | 'FUNNY_AWARD' | 'HISTORICAL' | 'OTHER';

  @ApiProperty({ example: 'Everyone remember when...', description: 'Short description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Full story of the epic fail...', description: 'Full story' })
  @IsString()
  story: string;

  @ApiProperty({ example: 'https://example.com/images/epic-fail.jpg', description: 'Image URL' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 2025, description: 'Year of the incident' })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiProperty({ example: true, description: 'Whether entry is featured', default: false })
  @IsBoolean()
  featured: boolean;

  @ApiProperty({ example: true, description: 'Whether entry is published/public' })
  @IsBoolean()
  published: boolean;

  @ApiProperty({ example: 'MEMBER_ID', description: 'Optional associated member', required: false })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @ApiProperty({ example: 'EVENT_ID', description: 'Optional associated event', required: false })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiProperty({ type: [String], example: ['tournament'], description: 'Tags', required: false })
  @IsOptional()
  @IsArray()
  tags?: string;

  @ApiProperty({ example: 'current-user-id', description: 'Creator ID (set server-side)', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
