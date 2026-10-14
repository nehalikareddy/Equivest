import { z } from 'zod';

const feedbackSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  strengths: z.array(z.string().trim().min(1).max(500)).max(8),
  missingInformation: z.array(z.string().trim().min(1).max(500)).max(8),
  suggestions: z.array(z.string().trim().min(1).max(500)).max(8)
}).strict();

const safeError = (message, status) => Object.assign(new Error(message), { status, expose: true });

export async function analyzeStartupPitch(pitch) {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    throw safeError('AI pitch analysis is not configured. Add AI_PROVIDER_API_KEY on the server to enable it.', 503);
  }

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Review the startup pitch and return only JSON with summary (string), strengths (string array), missingInformation (string array), and suggestions (string array). Keep feedback specific, actionable, and concise. Do not give investment advice.'
          },
          { role: 'user', content: pitch }
        ]
      })
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw safeError('Pitch analysis timed out. Please retry.', 504);
    }
    throw safeError('Pitch analysis provider is unavailable. Please retry.', 502);
  }

  if (response.status === 429) {
    throw safeError('Pitch analysis is temporarily busy. Please retry shortly.', 503);
  }
  if (!response.ok) {
    throw safeError('Pitch analysis provider could not complete the request. Please retry.', 502);
  }

  let providerBody;
  try {
    providerBody = await response.json();
  } catch {
    throw safeError('Pitch analysis provider returned an invalid response. Please retry.', 502);
  }

  let content;
  try {
    content = JSON.parse(providerBody.choices?.[0]?.message?.content);
  } catch {
    throw safeError('Pitch analysis provider returned invalid feedback. Please retry.', 502);
  }

  const parsed = feedbackSchema.safeParse(content);
  if (!parsed.success) {
    throw safeError('Pitch analysis provider returned incomplete feedback. Please retry.', 502);
  }
  return parsed.data;
}
