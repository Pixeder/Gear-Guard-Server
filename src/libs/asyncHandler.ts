import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * A higher-order function that wraps an async request handler to catch errors
 * and pass them to the Express error handling middleware.
 *
 * @param requestHandler - The async function to wrap.
 */
const asyncHandler =
  (requestHandler: AsyncRequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };

export { asyncHandler };