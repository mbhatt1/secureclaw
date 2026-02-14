/**
 * Maps application errors to gateway protocol ErrorShape
 */

import type { ErrorShape } from "./protocol/schema/types.js";
import {
  isAppError,
  isValidationError,
  isConfigError,
  isNetworkError,
  isAuthError,
  isNotFoundError,
  isTimeoutError,
  isOperationError,
  isStateError,
  formatErrorMessage,
} from "../infra/errors.js";
import { ErrorCodes } from "./protocol/schema/error-codes.js";

/**
 * Maps an error to a gateway ErrorShape with appropriate code and metadata.
 */
export function mapErrorToShape(err: unknown): ErrorShape {
  // Handle AppError and its subclasses
  if (isAppError(err)) {
    let code = err.code;
    let retryable = err.isRecoverable;

    // Map specific error types to gateway error codes
    if (isAuthError(err)) {
      code = "AUTH_ERROR";
      retryable = false;
    } else if (isNotFoundError(err)) {
      code = "NOT_FOUND";
      retryable = false;
    } else if (isTimeoutError(err)) {
      code = ErrorCodes.AGENT_TIMEOUT;
      retryable = true;
    } else if (isValidationError(err)) {
      code = ErrorCodes.INVALID_REQUEST;
      retryable = false;
    } else if (isNetworkError(err)) {
      code = ErrorCodes.UNAVAILABLE;
      retryable = true; // NetworkError is generally retryable
    }

    return {
      code,
      message: err.message,
      details: err.metadata,
      retryable,
    };
  }

  // Handle generic errors
  const message = formatErrorMessage(err);
  return {
    code: "INTERNAL_ERROR",
    message,
    retryable: false,
  };
}

/**
 * Determines HTTP status code for an error.
 */
export function mapErrorToHttpStatus(err: unknown): number {
  if (isAuthError(err)) {
    return 401;
  }
  if (isNotFoundError(err)) {
    return 404;
  }
  if (isValidationError(err)) {
    return 400;
  }
  if (isTimeoutError(err)) {
    return 408;
  }
  if (isNetworkError(err)) {
    return 503;
  }
  if (isConfigError(err)) {
    return 500;
  }
  if (isStateError(err)) {
    return 409;
  }
  if (isOperationError(err)) {
    return 500;
  }

  // Default for unknown errors
  return 500;
}
