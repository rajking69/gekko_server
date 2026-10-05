import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDate, IsMongoId, IsArray, Min, Max } from 'class-validator';

export class CreateHallOfFameDto {
  @ApiProperty({ example: 'member-of-the-year-2025', description: 'Unique slug' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Member of the Year 2025', description: 'Recognition title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'MEMBER_OF_THE_YEAR', description: 'Award category' })
  @IsEnum(['MEMBER_OF_THE_YEAR', 'BEST_CONTRIBUTOR', 'LEADERSHIP', 'TOURNAMENT_CHAMPION', 'COMMUNITY_SERVICE', 'SPECIAL_RECOGNITION', 'HISTORICAL', 'OTHER'])
  category: 'MEMBER_OF_THE_YEAR' | 'BEST_CONTRIBUTOR' | 'LEADERSHIP' | 'TOURNAMENT_CHAMPION' | 'COMMUNITY_SERVICE' | 'SPECIAL_RECOGNITION' | 'HISTORICAL' | 'OTHER';

  @ApiProperty({ example: 'In recognition of outstanding contribution to the community', description: 'Short description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Full story of the member\'s journey and impact on the community...', description: 'Full story' })
  @IsString()
  story: string;

  @ApiProperty({ example: 'https://example.com/images/motyw-2025.jpg', description: 'Image URL' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 2025, description: 'Award year' })
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiProperty({ example: true, description: 'Whether entry is featured on landing page', default: false })
  @IsBoolean()
  featured: boolean;

  @ApiProperty({ example: true, description: 'Whether entry is published/public' })
  @IsBoolean()
  published: boolean;

  @ApiProperty({ example: 'LEADERSHIP', description: 'Associated member', required: false })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @ApiProperty({ example: '5f8f8f8f8f8f8f8f8f8f8f00', description: 'Associated event/tournament', required: false })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiProperty({ type: [String], example: ['community-service'], description: 'Tags', required: false })
  @IsOptional()
  @IsArray()
  tags?: string;

  @ApiProperty({ example: 'current-user-id', description: 'Creator ID (set server-side)', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
