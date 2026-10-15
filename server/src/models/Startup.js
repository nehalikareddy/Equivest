import mongoose from 'mongoose';
import { INDUSTRIES, STARTUP_STAGES } from '../constants/startupOptions.js';

const startupSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  tagline: { type: String, required: true, trim: true, minlength: 5, maxlength: 180 },
  pitch: { type: String, required: true, trim: true, minlength: 30, maxlength: 10000 },
  industry: { type: String, required: true, enum: INDUSTRIES },
  stage: { type: String, required: true, enum: STARTUP_STAGES },
  amountSought: { type: Number, required: true, min: 1 },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  businessModel: { type: String, trim: true, maxlength: 500, default: '' },
  website: { type: String, trim: true, maxlength: 2048, default: '' }
}, { timestamps: true });

startupSchema.index({ founder: 1 });

export default mongoose.models.Startup || mongoose.model('Startup', startupSchema);