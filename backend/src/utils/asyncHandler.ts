import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Wraps an async route handler to catch rejected promises and
 * forward them to the Express global error handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .then(() => undefined)
      .catch(next)
  }
}
