import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import InvestorProfile from '../src/models/InvestorProfile.js';
import Startup from '../src/models/Startup.js';
import User from '../src/models/User.js';

let mongo;
let investor;
let founder;
let investorToken;
let founderToken;

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([InvestorProfile.deleteMany({}), Startup.deleteMany({}), User.deleteMany({})]);
  [investor, founder] = await User.create([
    { name: 'Investor One', email: 'investor@example.com', passwordHash: 'not-a-real-password-hash', role: 'investor' },
    { name: 'Founder One', email: 'founder@example.com', passwordHash: 'not-a-real-password-hash', role: 'founder' }
  ]);
  investorToken = tokenFor(investor);
  founderToken = tokenFor(founder);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('investor profile and matches API', () => {
  test('gets and saves preferences for the authenticated investor', async () => {
    const initial = await request(app).get('/api/investor/profile').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(initial.body.profile).toMatchObject({ industries: [], stages: [] });
    const response = await request(app).put('/api/investor/profile').set('Authorization', `Bearer ${investorToken}`).send({ industries: ['Technology'], stages: ['Seed'], minTicket: 1000000, maxTicket: 50000000 }).expect(200);
    expect(response.body.profile).toMatchObject({ industries: ['Technology'], stages: ['Seed'], minTicket: 1000000, maxTicket: 50000000 });
    await request(app).get('/api/investor/profile').set('Authorization', `Bearer ${founderToken}`).expect(403);
  });

  test('rejects an invalid range and invalid preference values', async () => {
    await request(app).put('/api/investor/profile').set('Authorization', `Bearer ${investorToken}`).send({ industries: [], stages: [], minTicket: 200, maxTicket: 100 }).expect(400);
    await request(app).put('/api/investor/profile').set('Authorization', `Bearer ${investorToken}`).send({ industries: ['Unknown'], stages: [], minTicket: 1, maxTicket: 100 }).expect(400);
  });

  test('returns explained, ranked matches and supports industry/stage filters', async () => {
    await InvestorProfile.create({ user: investor._id, industries: ['Technology'], stages: ['Seed'], minTicket: 100, maxTicket: 200 });
    await Startup.create([
      { founder: founder._id, name: 'Bravo Startup', tagline: 'A useful founder tagline', pitch: 'Detailed pitch content that describes the problem and business model.', industry: 'Technology', stage: 'Seed', amountSought: 150 },
      { founder: founder._id, name: 'Alpha Startup', tagline: 'A useful founder tagline', pitch: 'Detailed pitch content that describes the problem and business model.', industry: 'Technology', stage: 'Seed', amountSought: 155 },
      { founder: founder._id, name: 'Adjacent Startup', tagline: 'A useful founder tagline', pitch: 'Detailed pitch content that describes the problem and business model.', industry: 'Technology', stage: 'Pre-Seed', amountSought: 220 }
    ]);
    const response = await request(app).get('/api/matches').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(response.body.matches.map(({ startup: item }) => item.name)).toEqual(['Alpha Startup', 'Bravo Startup', 'Adjacent Startup']);
    expect(response.body.matches[0]).toMatchObject({ score: 100, reasons: expect.arrayContaining([expect.objectContaining({ criterion: 'industry', points: 40 })]) });
    const filtered = await request(app).get('/api/matches?industry=Technology&stage=Pre-Seed&sort=amount').set('Authorization', `Bearer ${investorToken}`).expect(200);
    expect(filtered.body.matches).toHaveLength(1);
    expect(filtered.body.matches[0].startup.name).toBe('Adjacent Startup');
  });
});
