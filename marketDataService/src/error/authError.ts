import type { ErrorMessages } from "../enums/message";

export class AuthError extends Error {
  public statusCode: number;

  constructor(message: ErrorMessages | string, statusCode: number = 500) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    // Ensure the prototype chain is correctly set for instanceof checks
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
