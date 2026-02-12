// ==============================================
// ERROR MIDDLEWARE - Centralized error handling
// Catches all unhandled errors in request pipeline
// ==============================================

import type { MiddlewareHandler } from 'hono';

export const errorMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('[Error Middleware]', {
      method: c.req.method,
      path: c.req.path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return c.json({ success: false, error: 'Invalid JSON in request body', code: 'INVALID_JSON' }, 400);
    }

    // Prisma errors
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return c.json({ success: false, error: 'Resource not found', code: 'NOT_FOUND' }, 404);
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ success: false, error: error.message, code: 'NOT_FOUND' }, 404);
    }

    // Anthropic API errors
    if (error instanceof Error && error.message.includes('API')) {
      return c.json({ success: false, error: 'AI service temporarily unavailable', code: 'AI_UNAVAILABLE' }, 503);
    }

    // Generic error
    return c.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          detail: error instanceof Error ? error.message : String(error),
        }),
      },
      500
    );
  }
};
