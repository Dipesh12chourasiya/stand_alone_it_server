import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 *
 * On success the parsed (and transformed) body replaces `req.body` so the
 * controller receives clean, typed data.  On failure ZodError is thrown
 * and caught by the global error handler.
 *
 * @param schema — a Zod object schema (e.g. `registerSchema`)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
