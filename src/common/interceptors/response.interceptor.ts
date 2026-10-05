import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: { message?: string; data?: unknown } | unknown) => {
        if (data && typeof data === 'object' && 'data' in data && 'message' in data) {
          return { success: true, ...data };
        }

        return {
          success: true,
          message: 'Request successful',
          data,
        };
      }),
    );
  }
}