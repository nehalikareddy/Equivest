import { z } from 'zod';
import { INDUSTRIES, STARTUP_STAGES } from '../constants/startupOptions.js';

const uniqueValues = (values) => new Set(values).size === values.length;

export const investorProfileSchema = z.object({
  industries: z.array(z.enum(INDUSTRIES)).max(INDUSTRIES.length).refine(uniqueValues, 'Choose each industry only once.'),
  stages: z.array(z.enum(STARTUP_STAGES)).max(STARTUP_STAGES.length).refine(uniqueValues, 'Choose each stage only once.'),
  minTicket: z.coerce.number().finite().positive(),
  maxTicket: z.coerce.number().finite().positive()
}).strict().refine((profile) => profile.minTicket <= profile.maxTicket, {
  message: 'Minimum investment cannot exceed maximum investment.',
  path: ['minTicket']
});

export const matchFilterSchema = z.object({
  industry: z.enum(INDUSTRIES).optional(),
  stage: z.enum(STARTUP_STAGES).optional(),
  sort: z.enum(['score', 'amount']).optional().default('score')
}).strict();
