export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502);
  }
}

export function handleError(error: unknown): {
  statusCode: number;
  message: string;
  isOperational: boolean;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      isOperational: error.isOperational,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: process.env.NODE_ENV === 'development'
        ? error.message
        : 'An unexpected error occurred',
      isOperational: false,
    };
  }

  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
    isOperational: false,
  };
}
