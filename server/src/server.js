import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured before starting the API.');
}

await mongoose.connect(process.env.MONGODB_URI);
app.listen(port, '127.0.0.1', () => console.log(`EquiVest API listening on http://127.0.0.1:${port}`));
