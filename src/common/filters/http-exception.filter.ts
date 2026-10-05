import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : null;
    const rawMessage = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? (exceptionResponse as { message?: string | string[] }).message
      : undefined;
    const message = rawMessage ?? (exception instanceof HttpException ? exception.message : 'Internal server error');
    const errors = Array.isArray(message) ? message : [];

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.message : 'Unhandled exception');
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? 'Bad Request' : message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}