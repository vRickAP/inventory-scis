import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: {},
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = exceptionResponse;
      } else {
        errorResponse = {
          code: 'HTTP_EXCEPTION',
          message: exceptionResponse,
          details: {},
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      errorResponse = {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
        details: process.env.NODE_ENV === 'production' ? {} : { stack: exception.stack },
      };
    }

    const responsePayload = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      error: errorResponse,
      correlationId: request.correlationId || 'unknown',
    };

    this.logger.error(
      `HTTP ${request.method} ${request.url} ${status} - ${JSON.stringify(errorResponse)}`,
    );

    response.status(status).json(responsePayload);
  }
}
