import { rankStartups, scoreStartup } from '../src/services/matchingService.js';

const preferences = { industries: ['Technology'], stages: ['Pre-Seed'], minTicket: 100, maxTicket: 200 };
const startup = (overrides = {}) => ({ name: 'Northstar', industry: 'Technology', stage: 'Pre-Seed', amountSought: 150, ...overrides });

describe('deterministic startup scoring', () => {
  test('awards a full score when all criteria match', () => {
    expect(scoreStartup(startup(), preferences).score).toBe(100);
  });

  test('returns zero when no criteria match', () => {
    const result = scoreStartup(startup({ industry: 'Healthcare', stage: 'Series B+', amountSought: 500 }), preferences);
    expect(result.score).toBe(0);
    expect(result.reasons.every((reason) => !reason.matched)).toBe(true);
  });

  test('scores an industry-only match', () => {
    expect(scoreStartup(startup({ stage: 'Series B+', amountSought: 500 }), preferences).score).toBe(40);
  });

  test('scores a stage-only match', () => {
    expect(scoreStartup(startup({ industry: 'Healthcare', amountSought: 500 }), preferences).score).toBe(30);
  });

  test('scores an amount-only match', () => {
    expect(scoreStartup(startup({ industry: 'Healthcare', stage: 'Series B+' }), preferences).score).toBe(30);
  });

  test('scores adjacent stages, including the Idea to Pre-Seed boundary', () => {
    const adjacent = scoreStartup(startup({ stage: 'Seed' }), preferences);
    const boundary = scoreStartup(startup({ stage: 'Idea' }), { ...preferences, stages: ['Pre-Seed'] });
    expect(adjacent.reasons.find((reason) => reason.criterion === 'stage').points).toBe(15);
    expect(boundary.reasons.find((reason) => reason.criterion === 'stage').points).toBe(15);
  });

  test('treats both investment range boundaries as full amount matches', () => {
    expect(scoreStartup(startup({ amountSought: 100 }), preferences).reasons.at(-1).points).toBe(30);
    expect(scoreStartup(startup({ amountSought: 200 }), preferences).reasons.at(-1).points).toBe(30);
  });

  test('awards partial points at exactly 25 percent outside either boundary', () => {
    expect(scoreStartup(startup({ amountSought: 75 }), preferences).reasons.at(-1).points).toBe(15);
    expect(scoreStartup(startup({ amountSought: 250 }), preferences).reasons.at(-1).points).toBe(15);
  });

  test('awards no amount points just beyond the 25 percent tolerance', () => {
    expect(scoreStartup(startup({ amountSought: 74.99 }), preferences).reasons.at(-1).points).toBe(0);
    expect(scoreStartup(startup({ amountSought: 250.01 }), preferences).reasons.at(-1).points).toBe(0);
  });

  test('handles invalid ranges and zero boundaries without division errors', () => {
    expect(scoreStartup(startup(), { ...preferences, minTicket: 300, maxTicket: 200 }).reasons.at(-1).points).toBe(0);
    expect(scoreStartup(startup({ amountSought: 1 }), { ...preferences, minTicket: 0, maxTicket: 0 }).reasons.at(-1).points).toBe(0);
  });

  test('empty preferences yield zero and stable ranking uses startup name', () => {
    expect(scoreStartup(startup(), {}).score).toBe(0);
    const ranked = rankStartups([startup({ name: 'Zulu' }), startup({ name: 'alpha' })], {});
    expect(ranked.map(({ startup: item }) => item.name)).toEqual(['alpha', 'Zulu']);
  });
});
