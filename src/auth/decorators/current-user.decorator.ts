import {
  SetMetadata,
  // MetadataHandler is not exported from @nestjs/common
  // We define the type locally instead
} from '@nestjs/common';

// Metadata keys for decorators
export const CURRENT_USER_KEY = 'current-user';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

// Type for the current user from Better Auth session
export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

/**
 * Sets the current user metadata on the handler.
 * Used by the @CurrentUser() decorator to inject the authenticated user.
 * 
 * Typically called by the AuthGuard after session validation.
 * 
 * @param user The authenticated user from Better Auth session
 * @returns Metadata decorator handler
 */
export function CurrentUser(user: CurrentUser): void {
  SetMetadata(CURRENT_USER_KEY, user);
}

/**
 * Sets the required roles metadata on the handler.
 * Used by the @Roles() decorator for authorization.
 * 
 * @param roles The required roles (array of role strings)
 * @returns void (uses SetMetadata internally)
 */
export function Roles(...roles: string[]): void {
  // Metadata is set via SetMetadata decorator below
}

/**
 * Sets the required permissions metadata on the handler.
 * Used by the @Permissions() decorator for fine-grained authorization.
 * 
 * @param permissions The required permissions (array of permission strings)
 * @returns void (uses SetMetadata internally)
 */
export function Permissions(...permissions: string[]): void {
  // Metadata is set via SetMetadata decorator below
}

/**
 * Decorator that injects the authenticated user into the constructor parameters
 * or method parameters of a controller method.
 * 
 * Usage:
 *  - Constructor: constructor(@CurrentUser() user: CurrentUser) { ... }
 *  - Method: @Get() myMethod(@CurrentUser() user: CurrentUser) { ... }
 *  - Class: @Controller() class MyController { @CurrentUser() user; ... }
 * 
 * The user object contains:
 * - id: Better Auth user ID
 * - email: user's email address
 * - name: user's display name
 */
export function CurrentUserDecorator() {
  return function (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ): void {
    // This decorator marks the parameter to be injected with the current user
    // The actual injection is handled by the CurrentUserPipe
  };
}