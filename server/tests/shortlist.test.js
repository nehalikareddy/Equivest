import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import Shortlist from '../src/models/Shortlist.js';
import Startup from '../src/models/Startup.js';
import User from '../src/models/User.js';

let mongo;
let founder;
let investor;
let anotherInvestor;
let founderToken;
let investorToken;
let anotherInvestorToken;
let startup;

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([Shortlist.deleteMany({}), Startup.deleteMany({}), User.deleteMany({})]);
  [founder, investor, anotherInvestor] = await User.create([
    { name: 'Founder One', email: 'founder@example.com', passwordHash: 'test-hash', role: 'founder' },
    { name: 'Investor One', email: 'investor@example.com', passwordHash: 'test-hash', role: 'investor' },
    { name: 'Investor Two', email: 'investor2@example.com', passwordHash: 'test-hash', role: 'investor' }
  ]);
  founderToken = tokenFor(founder);
  investorToken = tokenFor(investor);
  anotherInvestorToken = tokenFor(anotherInvestor);
  [startup] = await Startup.create([
    { founder: founder._id, name: 'Shortlist Startup', tagline: 'A platform for better teams', pitch: 'A sufficiently detailed pitch about a useful product and its customers.', industry: 'Technology', stage: 'Seed', amountSought: 10000000 },
    { founder: founder._id, name: 'Another Startup', tagline: 'A different founder tagline', pitch: 'A sufficiently detailed pitch about a useful product and its customers.', industry: 'Healthcare', stage: 'Pre-Seed', amountSought: 5000000 }
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('investor shortlist API', () => {
  test('adds a startup once and rejects duplicate entries', async () => {
    const response = await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(201);
    expect(response.body.shortlistItem.startupId).toBe(startup.id);
    await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(409);
    expect(await Shortlist.countDocuments({ investor, startup })).toBe(1);
  });

  test('lists only the authenticated investor’s saved startups without private founder fields', async () => {
    await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(201);
    const response = await request(app).get('/api/shortlist').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(response.body.shortlist).toHaveLength(1);
    expect(response.body.shortlist[0].startup.name).toBe('Shortlist Startup');
    expect(response.body.shortlist[0].startup.founder).toBeUndefined();
    const otherInvestorList = await request(app).get('/api/shortlist').set('Authorization', `Bearer ${anotherInvestorToken}`).expect(200);
    expect(otherInvestorList.body.shortlist).toHaveLength(0);
  });

  test('prevents access from founders and unauthenticated users', async () => {
    await request(app).get('/api/shortlist').expect(401);
    await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${founderToken}`).expect(403);
  });

  test('removes a saved startup and prevents cross-investor removal', async () => {
    await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(201);
    await request(app).delete(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${anotherInvestorToken}`).expect(404);
    await request(app).delete(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(204);
    const response = await request(app).get('/api/shortlist').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(response.body.shortlist).toHaveLength(0);
  });

  test('cleans shortlist references when the founder deletes a startup', async () => {
    await request(app).post(`/api/shortlist/${startup.id}`).set('Authorization', `Bearer ${investorToken}`).expect(201);
    await request(app).delete(`/api/startups/${startup.id}`).set('Authorization', `Bearer ${founderToken}`).expect(204);
    expect(await Shortlist.countDocuments({ startup: startup._id })).toBe(0);
    const response = await request(app).get('/api/shortlist').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(response.body.shortlist).toHaveLength(0);
  });

  test('rejects an unknown startup id', async () => {
    await request(app).post('/api/shortlist/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${investorToken}`).expect(404);
  });
});
