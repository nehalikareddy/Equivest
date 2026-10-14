import { z } from 'zod';
import { INDUSTRIES, STARTUP_STAGES } from '../constants/startupOptions.js';

const optionalText = (max) => z.string().trim().max(max).optional().default('');

export const startupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(5).max(180),
  pitch: z.string().trim().min(30).max(10000),
  industry: z.enum(INDUSTRIES),
  stage: z.enum(STARTUP_STAGES),
  amountSought: z.coerce.number().finite().positive(),
  location: optionalText(120),
  businessModel: optionalText(500),
  website: z.union([z.string().trim().url().max(2048), z.literal('')]).optional().default('')
}).strict();
