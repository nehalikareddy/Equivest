import { randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import shortlistRoutes from './routes/shortlistRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use((request, response, next) => {
  request.id = randomUUID();
  response.set('X-Request-Id', request.id);
  next();
});
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const clientOrigin = new URL(clientUrl).origin;
const allowedOrigins = new Set([clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, origin || clientUrl);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

function stripMongoOperators(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      stripMongoOperators(obj[key]);
    }
  }
}
app.use((request, _response, next) => {
  stripMongoOperators(request.body);
  stripMongoOperators(request.query);
  stripMongoOperators(request.params);
  next();
});

app.use((request, response, next) => {
  const method = request.method.toUpperCase();
  const changesState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const hasCookieToken = (request.headers.cookie || '').split(';').some((part) => part.trim().startsWith('token='));
  const hasBearer = /^Bearer\s+\S+/i.test(request.get('authorization') || '');
  if (!changesState || !hasCookieToken || hasBearer) return next();

  const suppliedOrigin = request.get('origin') || request.get('referer');
  if (suppliedOrigin) {
    try {
      if (allowedOrigins.has(new URL(suppliedOrigin).origin)) return next();
    } catch { /* invalid origin/referer is rejected below */ }
    return response.status(403).json({ error: 'Invalid or missing CSRF protection.' });
  }
  if (request.get('x-requested-with') === 'XMLHttpRequest') return next();
  return response.status(403).json({ error: 'Invalid or missing CSRF protection.' });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'equivest-api', uptime: process.uptime() });
});

// API routes are unversioned for assessment simplicity.
// In production, prefix with /api/v1/ for backward compatibility.
app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use(errorHandler);

export default app;