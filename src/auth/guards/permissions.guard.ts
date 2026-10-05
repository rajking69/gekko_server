import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class PermissionsGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredPermissions = (context.getHandler as any).metadata?.requiredPermissions ||
      (context.getClass && (context.getClass as any).metadata?.requiredPermissions);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = (request as any).user;
    if (!user || !user.permissions) {
      throw new Error('Authentication required');
    }

    const hasPermission = requiredPermissions.some(
      (permission: string) => user.permissions.includes(permission),
    );
    if (!hasPermission) {
      throw new Error('Insufficient permission privileges');
    }

    return true;
  }
}