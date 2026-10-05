import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';

// Token for Better Auth instance access
export const BETTER_AUTH_TOKEN = 'better-auth-instance';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(BETTER_AUTH_TOKEN) private readonly betterAuth: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const session = await this.betterAuth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session?.user) {
        throw new UnauthorizedException('Authentication required.');
      }

      (request as Request & { user?: Express.User }).user = session.user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentication failed. Invalid or expired session.');
    }
  }
}