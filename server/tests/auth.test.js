import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
  process.env.JWT_EXPIRES_IN = '1h';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => User.deleteMany({}));

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const founder = { name: 'A Founder', email: 'Founder@Example.com', password: 'correct horse battery', role: 'founder' };

describe('authentication API', () => {
  test('registers a user with normalized email and never returns the password hash', async () => {
    const response = await request(app).post('/api/auth/register').send(founder).expect(201);
    expect(response.body.user).toMatchObject({ name: 'A Founder', email: 'founder@example.com', role: 'founder' });
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.headers['set-cookie'][0]).toMatch(/^token=/);
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
    expect(response.headers['set-cookie'][0]).toMatch(/Path=\//i);
    expect(response.body.user.passwordHash).toBeUndefined();
    const user = await User.findOne({ email: 'founder@example.com' }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(founder.password);
  });

  test('rejects invalid registration data', async () => {
    await request(app).post('/api/auth/register').send({ ...founder, role: 'admin', email: 'invalid' }).expect(400);
  });

  test('rejects duplicate email addresses', async () => {
    await request(app).post('/api/auth/register').send(founder).expect(201);
    await request(app).post('/api/auth/register').send({ ...founder, email: founder.email.toLowerCase() }).expect(409);
  });

  test('logs in with valid credentials and rejects an invalid password', async () => {
    await request(app).post('/api/auth/register').send(founder).expect(201);
    const loggedIn = await request(app).post('/api/auth/login').send({ email: founder.email, password: founder.password }).expect(200);
    expect(loggedIn.body.user.email).toBe('founder@example.com');
    expect(loggedIn.body.token).toEqual(expect.any(String));
    expect(loggedIn.headers['set-cookie'][0]).toMatch(/^token=.*HttpOnly/i);
    expect(loggedIn.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
    await request(app).post('/api/auth/login').send({ email: founder.email, password: 'wrong-password' }).expect(401);
  });

  test('protects the current-user endpoint and returns the authenticated user', async () => {
    await request(app).get('/api/auth/me').expect(401);
    const { body } = await request(app).post('/api/auth/register').send(founder).expect(201);
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`).expect(200);
    expect(response.body.user).toMatchObject({ email: 'founder@example.com', role: 'founder' });
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token').expect(401);
  });

  test('authenticates the current user from the HTTP-only cookie', async () => {
    const loggedIn = await request(app).post('/api/auth/register').send(founder).expect(201);
    const cookie = loggedIn.headers['set-cookie'][0].split(';')[0];
    const response = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(response.body.user).toMatchObject({ email: 'founder@example.com', role: 'founder' });
  });

  test('logs out and clears the token cookie', async () => {
    const response = await request(app).post('/api/auth/logout').expect(200);
    expect(response.body).toEqual({ message: 'Logged out' });
    expect(response.headers['set-cookie'][0]).toMatch(/^token=;/);
    expect(response.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
  });

  test('enforces CSRF checks for cookie-authenticated state changes', async () => {
    const cookie = 'token=present';
    await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(403);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).set('Origin', 'https://attacker.example').set('X-Requested-With', 'XMLHttpRequest').expect(403);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).set('X-Requested-With', 'XMLHttpRequest').expect(200);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).set('Origin', 'http://localhost:5173').expect(200);
  });

  test('allows credentialed CORS for the configured client origin', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'http://localhost:5173').expect(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
