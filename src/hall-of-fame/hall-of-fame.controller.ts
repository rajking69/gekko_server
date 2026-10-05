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
import { HallOfFameService } from './hall-of-fame.service.ts';
import { CreateHallOfFameDto } from './dto/create-hall-of-fame.dto.ts';
import { CurrentUserDecorator } from '../auth/decorators/current-user.decorator.ts';
import { AuthGuard } from '../auth/guards/auth.guard.ts';
import { PermissionsGuard } from '../auth/guards/permissions.guard.ts';
@Controller('hall-of-fame')
export class HallOfFameController {
  constructor(private readonly hallOfFameService: HallOfFameService) {}
  
  // ========== PUBLIC (Anyone/Authenticated) ==========
  
  @Get()
  @HttpCode(HttpStatus.OK)
  async list(
    @Query('featured') featured: boolean = false,
    @Query('limit') limit: number = 20,
  ) {
    return this.hallOfFameService.findAllPublished(featured, limit);
  }
  
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async listFeatured(
    @Query('limit') limit: number = 6,
  ) {
    return this.hallOfFameService.findAllPublished(true, limit);
  }
  
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getBySlug(
    @Param('slug') slug: string,
  ) {
    return this.hallOfFameService.findOne(slug);
  }
  
  // ========== MANAGEMENT (Admin/Moderator only) ==========
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:create'])
  async create(
    @Body() createDto: CreateHallOfFameDto,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.create({
      ...createDto,
      createdBy: currentUser._id,
    });
  }
  
  @Patch(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:update'])
  async update(
    @Param('slug') slug: string,
    @Body() updates: Partial<CreateHallOfFameDto>,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.update(slug, updates);
  }
  
  @Delete(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:delete'])
  async delete(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.delete(slug);
  }
  
  @Patch(':slug/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:publish'])
  async publish(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.publish(slug);
  }
  
  @Patch(':slug/unpublish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:unpublish'])
  async unpublish(
    @Param('slug') slug: string,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.unpublish(slug);
  }
  
  @Patch(':slug/feature')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:feature'])
  async feature(
    @Param('slug') slug: string,
    @Body('featured') featured: boolean,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.feature(slug, featured);
  }
  
  @Patch(':slug/reorder')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, PermissionsGuard)
  @SetMetadata('requiredPermissions', ['hall-of-fame:reorder'])
  async reorder(
    @Param('slug') slug: string,
    @Body('displayOrder') displayOrder: number,
    @CurrentUserDecorator() currentUser: any,
  ) {
    return this.hallOfFameService.reorder(slug, displayOrder);
  }
}
