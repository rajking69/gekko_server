import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDate, IsArray, IsUrl, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'gekko-fifa-26-tournament', description: 'Unique event slug' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Gekko FIFA 26 Co-Op Tournament', description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ example: "The ultimate competitive EA SPORTS FC 26 experience.", description: 'Event description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'The ultimate competitive experience.', description: 'Short description', required: false })
  @IsOptional()
  @IsString()
  shortDescription: string;

  @ApiProperty({ example: 'radial-gradient(at 20% 30%, #ef4444 0%, transparent 60%)', description: 'Cover gradient', required: false })
  @IsOptional()
  @IsString()
  coverGradient: string;

  @ApiProperty({ example: 'Bangladesh', description: 'Event location' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'Asia/Dhaka', description: 'Timezone' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: false, description: 'Whether event is online' })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({ example: 16, description: 'Maximum capacity', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity: number | null;

  @ApiProperty({ example: 0, description: 'Number of registered participants', default: 0 })
  @IsNumber()
  registered: number;

  @ApiProperty({ example: 'pink', description: 'Accent color' })
  @IsEnum(['gekko', 'violet', 'cyan', 'pink', 'amber'])
  accent: 'gekko' | 'violet' | 'cyan' | 'pink' | 'amber';

  @ApiProperty({ example: 'tournament', description: 'Event type' })
  @IsEnum(['community', 'meetup', 'bbq', 'movie', 'reception', 'workshop', 'seminar', 'tournament', 'other'])
  type: 'community' | 'meetup' | 'bbq' | 'movie' | 'reception' | 'workshop' | 'seminar' | 'tournament' | 'other';

  @ApiProperty({ example: 'open', description: 'Event status' })
  @IsEnum(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

  @ApiProperty({ example: 'F', description: 'Glyph character', required: false })
  @IsOptional()
  @IsString()
  glyph?: string;

  @ApiProperty({ example: '2v2 Co-Op', description: 'Event format', required: false })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ example: 'https://example.com/stream', description: 'Stream URL', required: false })
  @IsOptional()
  @IsUrl()
  streamUrl?: string;

  @ApiProperty({ example: 'https://google.com/form', description: 'Registration URL', required: false })
  @IsOptional()
  @IsUrl()
  registerUrl?: string;

  @ApiProperty({ example: '/tournament', description: 'Results URL', required: false })
  @IsOptional()
  @IsUrl()
  resultsUrl?: string;

  @ApiProperty({ example: '2026-07-01T14:00:00Z', description: 'Event start time' })
  @IsDate()
  startAt: Date;

  @ApiProperty({ example: '2026-07-05T23:59:59Z', description: 'Event end time' })
  @IsDate()
  endAt: Date;

  @ApiProperty({ example: 'Registration deadline', description: 'Registration deadline', required: false })
  @IsOptional()
  @IsDate()
  registrationDeadline?: Date;

  @ApiProperty({ example: "Group stage · BO3 · BO5 finals", description: 'Event requirements', required: false })
  @IsOptional()
  @IsArray()
  requirements?: string[];

  @ApiProperty({ type: () => EventScheduleItemDto, description: 'Event schedule/agenda', required: false })
  @IsOptional()
  @IsArray()
  schedule?: EventScheduleItemDto[];
}

class EventScheduleItemDto {
  @ApiProperty({ example: 'Round of 16', description: 'Stage label' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'T+90min', description: 'Relative time' })
  @IsString()
  time: string;

  @ApiProperty({ example: 'Q&A', description: 'Secondary detail', required: false })
  @IsOptional()
  @IsString()
  detail?: string;
}
