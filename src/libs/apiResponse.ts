/**
 * Represents a standardized API response structure.
 * @template T The type of the data payload.
 */
class apiResponse<T = any> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;

  /**
   * Constructs a new API response.
   * @param statusCode - The HTTP status code.
   * @param data - The payload to return.
   * @param message - Optional message (default: "success").
   */
  constructor(statusCode: number, data: T, message: string = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { apiResponse };
