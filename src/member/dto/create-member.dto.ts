import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'auth-user-id', description: 'Better Auth user ID' })
  @IsString()
  authUserId: string;

  @ApiProperty({ example: 'member@example.com', description: 'Authenticated email' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john_doe', description: 'Display name' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'member', description: 'Authenticated role', required: false })
  @IsOptional()
  @IsString()
  role: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', description: 'Cover image URL', required: false })
  @IsOptional()
  @IsString()
  coverImage: string;

  @ApiProperty({ example: 'Community lead organizes tournaments', description: 'Biography', required: false })
  @IsOptional()
  @IsString()
  bio: string;

  @ApiProperty({ example: 'CSE', description: 'Department', required: false })
  @IsOptional()
  @IsString()
  department: string;

  @ApiProperty({ example: '2024', description: 'Batch/year', required: false })
  @IsOptional()
  @IsString()
  batch: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], example: 'ACTIVE', description: 'Member status' })
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @ApiProperty({ example: ['valorant', 'pubg'], description: 'Main games', required: false })
  @IsOptional()
  @IsArray()
  mainGames: string[];

  @ApiProperty({ example: ['b_pioneer'], description: 'Badge IDs', required: false })
  @IsOptional()
  @IsArray()
  badges: string[];

  @ApiProperty({ enum: ['gekko', 'violet', 'cyan', 'pink', 'amber'], example: 'gekko', description: 'Accent color' })
  @IsOptional()
  @IsString()
  accent: 'gekko' | 'violet' | 'cyan' | 'pink' | 'amber';

  @ApiProperty({ example: 'Berlin', description: 'Location', required: false })
  @IsOptional()
  @IsString()
  location: string;

  @ApiProperty({ example: 'he/him', description: 'Pronouns', required: false })
  @IsOptional()
  @IsString()
  pronouns: string;

  @ApiProperty({ example: 0, description: 'XP', required: false })
  @IsOptional()
  @IsNumber()
  xp: number;

  @ApiProperty({ example: 1, description: 'Level', required: false })
  @IsOptional()
  @IsNumber()
  level: number;

  @ApiProperty({ example: true, description: 'Whether email verified', required: false })
  @IsOptional()
  @IsBoolean()
  isVerified: boolean;
}