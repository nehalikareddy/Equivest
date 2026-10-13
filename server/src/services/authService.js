import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const WORK_FACTOR = 12;

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

export async function registerUser({ name, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
  }
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, WORK_FACTOR),
    role
  });
  return { user: publicUser(user), token: issueToken(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw Object.assign(new Error('Email or password is incorrect.'), { status: 401 });
  }
  return { user: publicUser(user), token: issueToken(user) };
}

export function currentUser(user) {
  return publicUser(user);
}
