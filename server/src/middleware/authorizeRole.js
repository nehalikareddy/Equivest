export function authorizeRole(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(Object.assign(new Error('You do not have permission to access this resource.'), { status: 403 }));
    }
    return next();
  };
}
