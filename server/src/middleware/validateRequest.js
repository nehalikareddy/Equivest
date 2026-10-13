export function validateRequest(schema) {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const error = new Error('Invalid request data.');
      error.status = 400;
      error.details = parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
      return next(error);
    }
    request.validatedBody = parsed.data;
    return next();
  };
}
