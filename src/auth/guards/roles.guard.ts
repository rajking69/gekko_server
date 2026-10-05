import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RolesGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredRoles = (context.getHandler as any).metadata?.requiredRoles ||
      (context.getClass && (context.getClass as any).metadata?.requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = (request as any).user;
    if (!user || !user.roles) {
      throw new Error('Authentication required');
    }

    const hasRole = user.roles.some((role: string) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new Error('Insufficient role privileges');
    }

    return true;
  }
}