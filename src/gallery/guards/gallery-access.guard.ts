import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRIVILEGED_ROLES = new Set(['moderator', 'admin', 'super_admin', 'owner']);

@Injectable()
export class GalleryAccessGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { email?: string; role?: string; roles?: string[] } }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    const roles = [user.role, ...(user.roles ?? [])].filter((role): role is string => Boolean(role));
    const configuredEmails = [
      this.configService.get<string>('adminWhitelistEmails'),
      this.configService.get<string>('galleryModeratorEmails'),
    ]
      .filter(Boolean)
      .flatMap((value) => value!.split(','))
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (roles.some((role) => PRIVILEGED_ROLES.has(role)) || (user.email && configuredEmails.includes(user.email.toLowerCase()))) {
      return true;
    }

    throw new ForbiddenException('Gallery moderation privileges required.');
  }
}
