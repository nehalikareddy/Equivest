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
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const clientOrigin = new URL(clientUrl).origin;
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use((request, response, next) => {
  const method = request.method.toUpperCase();
  const changesState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const hasCookieToken = (request.headers.cookie || '').split(';').some((part) => part.trim().startsWith('token='));
  const hasBearer = /^Bearer\s+\S+/i.test(request.get('authorization') || '');
  if (!changesState || !hasCookieToken || hasBearer) return next();

  const suppliedOrigin = request.get('origin') || request.get('referer');
  if (suppliedOrigin) {
    try {
      if (new URL(suppliedOrigin).origin === clientOrigin) return next();
    } catch { /* invalid origin/referer is rejected below */ }
    return response.status(403).json({ error: 'Invalid or missing CSRF protection.' });
  }
  if (request.get('x-requested-with') === 'XMLHttpRequest') return next();
  return response.status(403).json({ error: 'Invalid or missing CSRF protection.' });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok', service: 'equivest-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use(errorHandler);

export default app;
