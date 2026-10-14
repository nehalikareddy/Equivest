import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Startup from '../src/models/Startup.js';
import User from '../src/models/User.js';

let mongo;
let founder;
let anotherFounder;
let investor;
let founderToken;
let anotherFounderToken;
let investorToken;

const payload = {
  name: 'Northstar Labs',
  tagline: 'Better logistics for growing businesses',
  pitch: 'We help small businesses coordinate deliveries and reduce operational costs with our planning platform.',
  industry: 'Technology',
  stage: 'Seed',
  amountSought: 25000000,
  location: 'Bengaluru, India',
  businessModel: 'B2B SaaS subscription',
  website: 'https://northstar.example'
};

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([Startup.deleteMany({}), User.deleteMany({})]);
  [founder, anotherFounder, investor] = await User.create([
    { name: 'Founder One', email: 'one@example.com', passwordHash: 'not-a-real-password-hash', role: 'founder' },
    { name: 'Founder Two', email: 'two@example.com', passwordHash: 'not-a-real-password-hash', role: 'founder' },
    { name: 'Investor One', email: 'investor@example.com', passwordHash: 'not-a-real-password-hash', role: 'investor' }
  ]);
  founderToken = tokenFor(founder);
  anotherFounderToken = tokenFor(anotherFounder);
  investorToken = tokenFor(investor);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('startup API', () => {
  test('creates and lists only the authenticated founder’s startups', async () => {
    const created = await request(app).post('/api/startups').set('Authorization', `Bearer ${founderToken}`).send(payload).expect(201);
    expect(created.body.startup).toMatchObject({ name: payload.name, amountSought: payload.amountSought, stage: 'Seed' });
    expect(created.body.startup.founder).toBeUndefined();
    await request(app).post('/api/startups').set('Authorization', `Bearer ${anotherFounderToken}`).send({ ...payload, name: 'Other Startup' }).expect(201);
    const list = await request(app).get('/api/startups/mine').set('Authorization', `Bearer ${founderToken}`).expect(200);
    expect(list.body.startups).toHaveLength(1);
    expect(list.body.startups[0].name).toBe(payload.name);
  });

  test('rejects invalid input and client-supplied ownership fields', async () => {
    await request(app).post('/api/startups').set('Authorization', `Bearer ${founderToken}`).send({ ...payload, amountSought: 0 }).expect(400);
    await request(app).post('/api/startups').set('Authorization', `Bearer ${founderToken}`).send({ ...payload, founder: anotherFounder.id }).expect(400);
  });

  test('enforces founder role and authentication', async () => {
    await request(app).post('/api/startups').send(payload).expect(401);
    await request(app).post('/api/startups').set('Authorization', `Bearer ${investorToken}`).send(payload).expect(403);
    await request(app).get('/api/startups/mine').set('Authorization', `Bearer ${investorToken}`).expect(403);
  });

  test('supports owner updates and hides other founders’ records', async () => {
    const created = await request(app).post('/api/startups').set('Authorization', `Bearer ${founderToken}`).send(payload).expect(201);
    const id = created.body.startup.id;
    await request(app).put(`/api/startups/${id}`).set('Authorization', `Bearer ${anotherFounderToken}`).send(payload).expect(404);
    await request(app).get(`/api/startups/${id}`).set('Authorization', `Bearer ${anotherFounderToken}`).expect(404);
    const updated = await request(app).put(`/api/startups/${id}`).set('Authorization', `Bearer ${founderToken}`).send({ ...payload, name: 'Northstar Updated' }).expect(200);
    expect(updated.body.startup.name).toBe('Northstar Updated');
    await request(app).get(`/api/startups/${id}`).set('Authorization', `Bearer ${investorToken}`).expect(200);
  });

  test('deletes only an owned startup', async () => {
    const created = await request(app).post('/api/startups').set('Authorization', `Bearer ${founderToken}`).send(payload).expect(201);
    const id = created.body.startup.id;
    await request(app).delete(`/api/startups/${id}`).set('Authorization', `Bearer ${anotherFounderToken}`).expect(404);
    await request(app).delete(`/api/startups/${id}`).set('Authorization', `Bearer ${founderToken}`).expect(204);
    await request(app).get(`/api/startups/${id}`).set('Authorization', `Bearer ${investorToken}`).expect(404);
  });
});
