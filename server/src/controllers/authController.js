import { currentUser, loginUser, registerUser } from '../services/authService.js';

export async function register(request, response, next) {
  try {
    const result = await registerUser(request.validatedBody);
    response.status(201).json(result);
  } catch (error) { next(error); }
}

export async function login(request, response, next) {
  try {
    response.json(await loginUser(request.validatedBody));
  } catch (error) { next(error); }
}

export function me(request, response) {
  response.json({ user: currentUser(request.user) });
}
