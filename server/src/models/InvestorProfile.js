import mongoose from 'mongoose';
import { INDUSTRIES, STARTUP_STAGES } from '../constants/startupOptions.js';

const investorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  industries: { type: [{ type: String, enum: INDUSTRIES }], default: [] },
  stages: { type: [{ type: String, enum: STARTUP_STAGES }], default: [] },
  minTicket: { type: Number, min: 0, default: 1 },
  maxTicket: { type: Number, min: 1, default: 1 }
}, { timestamps: true });

investorProfileSchema.pre('validate', function validateTicketRange(next) {
  if (this.minTicket > this.maxTicket) this.invalidate('minTicket', 'Minimum ticket cannot exceed maximum ticket.');
  next();
});

export default mongoose.models.InvestorProfile || mongoose.model('InvestorProfile', investorProfileSchema);
