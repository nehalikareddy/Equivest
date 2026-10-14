export function errorHandler(error, _request, response, _next) {
  if (response.headersSent) return;
  if (error.code === 11000) {
    const duplicateMessage = error.keyPattern?.email
      ? 'An account with this email already exists.'
      : error.keyPattern?.investor && error.keyPattern?.startup
        ? 'Startup is already on your shortlist.'
        : 'A record with those values already exists.';
    response.status(409).json({ error: duplicateMessage });
    return;
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : error.message || 'An unexpected error occurred.';
  response.status(status).json({ error: message, ...(error.details ? { details: error.details } : {}) });
}
