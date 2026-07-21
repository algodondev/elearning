import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestWithId } from '../interceptors/request-id.interceptor';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithId>();
    const databaseError = this.databaseError(exception);
    const statusCode = databaseError
      ? HttpStatus.CONFLICT
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const payload = typeof raw === 'object' && raw ? raw : {};
    const rawMessage = (payload as { message?: string | string[] }).message;
    const details = Array.isArray(rawMessage) ? rawMessage : undefined;
    const payloadDetails = (payload as { details?: unknown }).details;
    const code =
      databaseError?.code ??
      (payload as { code?: string }).code ??
      (details ? 'VALIDATION_FAILED' : this.defaultCode(statusCode));
    const message =
      databaseError?.message ??
      (details
        ? 'Request validation failed.'
        : typeof rawMessage === 'string'
          ? rawMessage
          : statusCode === 500
            ? 'Internal server error.'
            : 'Request failed.');

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        databaseError
          ? `Database constraint violation (${databaseError.driverCode}); requestId=${request.requestId ?? 'unknown'}`
          : `Unhandled exception; requestId=${request.requestId ?? 'unknown'}`,
      );
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      ...(details && { details }),
      ...(payloadDetails !== undefined ? { details: payloadDetails } : {}),
      path: request.originalUrl,
      requestId:
        request.requestId ?? request.header('x-request-id') ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  private databaseError(
    exception: unknown,
  ): { code: string; message: string; driverCode: string } | undefined {
    if (!(exception instanceof QueryFailedError)) return undefined;
    const driverCode = String(
      (exception.driverError as { code?: string }).code ?? '',
    );
    return {
      '23505': {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'A record with the same unique value already exists.',
        driverCode,
      },
      '23503': {
        code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
        message: 'The operation conflicts with a related record.',
        driverCode,
      },
      '23514': {
        code: 'CHECK_CONSTRAINT_VIOLATION',
        message: 'The data violates a business constraint.',
        driverCode,
      },
      '40001': {
        code: 'CONCURRENT_MODIFICATION',
        message: 'The resource changed concurrently; retry the operation.',
        driverCode,
      },
      '40P01': {
        code: 'CONCURRENT_MODIFICATION',
        message: 'The resource changed concurrently; retry the operation.',
        driverCode,
      },
    }[driverCode];
  }

  private defaultCode(status: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'TOO_MANY_REQUESTS',
      }[status] ?? 'INTERNAL_SERVER_ERROR'
    );
  }
}
