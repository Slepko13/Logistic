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
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Внутрішня помилка сервера';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        message = (res as Record<string, unknown>).message;
      } else {
        message = res;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      typeof (exception as Record<string, unknown>).code === 'string' &&
      ((exception as Record<string, unknown>).code as string).startsWith('P')
    ) {
      // Handle known Prisma errors
      const code = (exception as Record<string, unknown>).code as string;
      status = HttpStatus.BAD_REQUEST;
      switch (code) {
        case 'P2002':
          message = 'Запис з такими даними вже існує.';
          status = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = "Неможливо виконати дію: запис пов'язаний з іншими даними.";
          break;
        case 'P2025':
          message = 'Запис не знайдено.';
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          message = 'Помилка бази даних.';
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          break;
      }
      this.logger.error(`Prisma Error [${code}] at ${request.url}:`, exception);
    } else {
      // Unhandled exceptions (e.g. TypeError, SyntaxError)
      this.logger.error(
        `Unhandled Exception at ${request.url}: ${
          exception instanceof Error ? exception.message : JSON.stringify(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Always send a sanitized JSON response (no stack traces or raw SQL queries)
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
