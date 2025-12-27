/**
 * Represents a specific detail about an error, often used for validation errors.
 */
export type ErrorDetail = {
  field?: string;
  message: string;
};

/**
 * Custom Error class for API-related errors.
 * Extends the built-in Error class to include status codes and detailed error lists.
 */
export class apiError extends Error {
  public readonly statusCode: number;
  public readonly success: false = false;
  public readonly errors: ErrorDetail[];
  public readonly data: null = null;

  /**
   * @param statusCode - HTTP status code for the error.
   * @param message - Error message (default: "Something went wrong").
   * @param errors - Array of detailed errors (optional).
   * @param stack - Stack trace (optional).
   */
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: ErrorDetail[] = [],
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;

    // Capture stack trace if not provided
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
