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
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

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
