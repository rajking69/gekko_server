import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  SetMetadata,
  Query,
} from '@nestjs/common';
import { HallOfShameService } from './hall-of-shame.service.ts';
import { CreateHallOfShameDto } from './dto/create-hall-of-shame.dto.ts';
import { CurrentUserDecorator } from '../auth/decorators/current-user.decorator.ts';
import { AuthGuard } from '../auth/guards/auth.guard.ts';
import { PermissionsGuard } from '../auth/guards/permissions.guard.ts';
@Controller('hall-of-shame')
export class HallOfShameController {
  constructor(private readonly hallOfShameService: HallOfShameService) {}
  
  // ========== PUBLIC (Anyone/Authenticated) ==========
  
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query('featured') featured: boolean = false,
    @Query('limit') limit: number = 20,
  ) {
    return this.hallOfShameService.findAllPublished(featured, limit);
  }
  
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async listFeatured(
    @Query('limit') limit: number = 6,
  ) {
    return this.hallOfShameService.findAllPublished(true, limit);
  }
  
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getBySlug(
    @Param('slug') slug: string,
  ) {
    return this.hallOfShameService.findOne(slug);
  }
  
  // ========== MANAGEMENT (Admin/Moderator only) ==========
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:create'])
  async create(
    @Body() createDto: CreateHallOfShameDto,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.create({
      ...createDto,
      createdBy: currentUser._id,
    });
  }
  
  @Patch(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:update'])
  async update(
    @Param('slug') slug: string,
    @Body() updates: Partial<CreateHallOfShameDto>,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.update(slug, updates);
  }
  
  @Delete(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:delete'])
  async delete(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.delete(slug);
  }
  
  @Patch(':slug/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:publish'])
  async publish(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.publish(slug);
  }
  
  @Patch(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:unpublish'])
  async unpublish(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.unpublish(slug);
  }
  
  @Patch(':slug/feature')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:feature'])
  async feature(
    @Param('slug') slug: string,
    @Body('featured') featured: boolean,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.feature(slug, featured);
  }
  
  @Patch(':slug/reorder')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-shame:reorder'])
  async reorder(
    @Param('slug') slug: string,
    @Body('displayOrder') displayOrder: number,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfShameService.reorder(slug, displayOrder);
  }
}
