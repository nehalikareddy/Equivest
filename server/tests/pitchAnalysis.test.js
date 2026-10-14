import { jest } from '@jest/globals';
import { analyzeStartupPitch } from '../src/services/pitchAnalysisService.js';

const feedback = {
  summary: 'The pitch states the problem and proposed solution.',
  strengths: ['Names the target customer'],
  missingInformation: ['Quantify the market opportunity'],
  suggestions: ['Add evidence from customer interviews']
};

describe('pitch analysis service', () => {
  const originalKey = process.env.AI_PROVIDER_API_KEY;

  beforeEach(() => { process.env.AI_PROVIDER_API_KEY = 'test-provider-key'; });
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey === undefined) delete process.env.AI_PROVIDER_API_KEY;
    else process.env.AI_PROVIDER_API_KEY = originalKey;
  });

  test('returns schema-validated structured feedback', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(feedback) } }] })
    });

    await expect(analyzeStartupPitch('Our startup pitch')).resolves.toEqual(feedback);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-provider-key');
    expect(JSON.parse(options.body).messages[1].content).toBe('Our startup pitch');
  });

  test('reports an actionable configuration error when no API key is set', async () => {
    delete process.env.AI_PROVIDER_API_KEY;
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({
      status: 503,
      expose: true,
      message: expect.stringContaining('AI_PROVIDER_API_KEY')
    });
  });

  test('rejects malformed provider JSON and incomplete feedback', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{not json' } }] })
    });
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({ status: 502 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ ...feedback, extra: true }) } }] })
    });
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({ status: 502 });
  });

  test('handles provider rate limits, failures, and network timeouts safely', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 429 });
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({ status: 503 });
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({ status: 502 });
    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';
    fetchMock.mockRejectedValue(timeout);
    await expect(analyzeStartupPitch('A pitch')).rejects.toMatchObject({ status: 504 });
  });
});
