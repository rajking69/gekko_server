import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser, CURRENT_USER_KEY } from '../decorators/current-user.decorator.ts';
import { Reflector } from '@nestjs/core';

/**
 * Pipe that extracts the authenticated user from the request.
 * 
 * This pipe is used in conjunction with the @CurrentUser() decorator.
 * It reads the user from the request object (set by AuthGuard) and
 * validates/transforms it into the CurrentUser type.
 * 
 * Usage:
 *   @Get()
 *   myMethod(@CurrentUser() user: CurrentUser) { ... }
 * 
 * The AuthGuard sets request.user after session validation via Better Auth.
 * The pipe reads from `request.user` which is set by the AuthGuard.
 */
@Injectable()
export class CurrentUserPipe implements PipeTransform {
  constructor(private readonly reflector: Reflector) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Read user from request object - this is the primary purpose of the pipe
    // The AuthGuard sets request.user after session validation via Better Auth
    // We use a type-safe cast since Express Request doesn't declare 'user'
    const request = value as Request & { user?: CurrentUser };
    if (request && request.user) {
      const user = request.user;
      // Validate that the user has the required fields
      if (user && user.id && user.email) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
        };
      }
    }

    // If no user found, return null
    return null;
  }
}