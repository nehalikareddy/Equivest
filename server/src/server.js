import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI must be configured before starting the API.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`EquiVest API listening on http://127.0.0.1:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.disconnect().then(() => process.exit(0));
  });
});