import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(request, _response, next) {
  const authorization = request.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(Object.assign(new Error('Authentication required.'), { status: 401 }));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(Object.assign(new Error('Authentication required.'), { status: 401 }));
    request.user = user;
    return next();
  } catch {
    return next(Object.assign(new Error('Invalid or expired token.'), { status: 401 }));
  }
}
