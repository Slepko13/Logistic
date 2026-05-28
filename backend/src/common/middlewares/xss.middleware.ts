import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class XssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitize(req.body);
    }
    if (req.query) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.query = this.sanitize(req.query) as any;
    }
    if (req.params) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.params = this.sanitize(req.params) as any;
    }
    next();
  }

  private sanitize(data: unknown): unknown {
    if (typeof data === 'string') {
      // Remove all HTML tags and attributes
      return sanitizeHtml(data, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === 'object' && data !== null && data.constructor === Object) {
      const sanitizedObj: Record<string, unknown> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitizedObj[key] = this.sanitize((data as Record<string, unknown>)[key]);
        }
      }
      return sanitizedObj;
    }

    return data;
  }
}
