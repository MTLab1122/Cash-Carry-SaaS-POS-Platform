import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: any }>();

    const traceId = (request.headers['x-trace-id'] as string) || randomUUID();
    const tenantId = request.user?.tenantId || (request.headers['x-tenant-id'] as string) || 'anonymous';
    const userId = request.user?.id || 'anonymous';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred processing your request.';
    let type = 'https://tools.ietf.org/html/rfc7807#section-6.6.1';
    let invalidParams: any = undefined;

    // 1. Zod / Validation Errors -> 422 Unprocessable Entity
    if (exception?.name === 'ZodError' || exception?.errors) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      title = 'Unprocessable Entity';
      type = 'https://tools.ietf.org/html/rfc4918#section-11.2';
      detail = 'The request payload failed validation checks.';
      invalidParams = exception.errors || exception.issues;
    }
    // 2. Prisma Constraint Violations
    else if (exception?.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      title = 'Conflict';
      type = 'https://tools.ietf.org/html/rfc7231#section-6.5.8';
      const target = exception.meta?.target ? ` on field '${exception.meta.target}'` : '';
      detail = `A resource with identical unique constraints already exists${target}.`;
    } else if (exception?.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      title = 'Not Found';
      type = 'https://tools.ietf.org/html/rfc7231#section-6.5.4';
      detail = 'The requested resource was not found.';
    }
    // 3. NestJS Built-in HttpExceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      title = exception.name || 'HTTP Error';
      detail = typeof res === 'string' ? res : res.message || exception.message;
      if (typeof res === 'object' && res.errors) {
        invalidParams = res.errors;
      }
      type = `https://httpstatuses.com/${status}`;
    } else if (exception?.message) {
      detail = exception.message;
    }

    const problemDetails: Record<string, any> = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      traceId,
      timestamp: new Date().toISOString(),
    };

    if (invalidParams) {
      problemDetails.invalidParams = invalidParams;
    }

    // In non-production, include error stack for debugging
    if (process.env.NODE_ENV !== 'production' && exception?.stack) {
      problemDetails.stack = exception.stack;
    }

    // Structured JSON Logging for Observability
    this.logger.error(
      JSON.stringify({
        level: 'error',
        trace_id: traceId,
        tenant_id: tenantId,
        user_id: userId,
        status,
        method: request.method,
        path: request.url,
        message: detail,
      }),
    );

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .header('X-Trace-ID', traceId)
      .json(problemDetails);
  }
}
