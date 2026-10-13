import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MediaTypeFilter {
  ALL = 'all',
  IMAGE = 'image',
  VIDEO = 'video',
}

export class QueryGalleryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 16, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 16;

  @ApiPropertyOptional({ enum: MediaTypeFilter, default: MediaTypeFilter.ALL })
  @IsOptional()
  @IsEnum(MediaTypeFilter)
  mediaType?: MediaTypeFilter = MediaTypeFilter.ALL;

  @ApiPropertyOptional({ description: 'Search by filename' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'newest' })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' | 'name' = 'newest';
}

export class AdminQueryGalleryDto extends QueryGalleryDto {
  @ApiPropertyOptional({ description: 'Filter by visibility' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Include sync status in response' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeSyncStatus?: boolean = false;
}

export class UpdateVisibilityDto {
  @ApiPropertyOptional({ description: 'Set item visibility' })
  @IsBoolean()
  isVisible!: boolean;
}