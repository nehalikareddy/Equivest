import { currentUser, loginUser, registerUser } from '../services/authService.js';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

const tokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 24 * 60 * 60 * 1000 // 1 day, aligned with JWT_EXPIRES_IN
};

export async function register(request, response, next) {
  try {
    const result = await registerUser(request.validatedBody);
    response.cookie('token', result.token, tokenCookieOptions);
    response.status(201).json(result);
  } catch (error) { next(error); }
}

export async function login(request, response, next) {
  try {
    const result = await loginUser(request.validatedBody);
    response.cookie('token', result.token, tokenCookieOptions);
    response.json(result);
  } catch (error) { next(error); }
}

export function logout(_request, response) {
  response.clearCookie('token', baseCookieOptions);
  response.json({ message: 'Logged out' });
}

export function me(request, response) {
  response.json({ user: currentUser(request.user) });
}