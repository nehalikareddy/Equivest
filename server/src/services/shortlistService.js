import mongoose from 'mongoose';
import Shortlist from '../models/Shortlist.js';
import Startup from '../models/Startup.js';
import { toPublicStartup } from './startupService.js';

const notFound = () => Object.assign(new Error('Startup not found.'), { status: 404 });

export async function listInvestorShortlist(investorId) {
  const entries = await Shortlist.find({ investor: investorId }).sort({ createdAt: -1, _id: 1 }).populate('startup');
  const saved = entries.filter((entry) => entry.startup);
  return saved.map((entry) => ({
    id: entry._id.toString(),
    addedAt: entry.createdAt,
    startup: toPublicStartup(entry.startup)
  }));
}

export async function addStartupToShortlist(investorId, startupId) {
  if (!mongoose.isValidObjectId(startupId) || !(await Startup.exists({ _id: startupId }))) throw notFound();
  try {
    const entry = await Shortlist.create({ investor: investorId, startup: startupId });
    return { id: entry._id.toString(), startupId: startupId.toString(), addedAt: entry.createdAt };
  } catch (error) {
    if (error.code === 11000) {
      throw Object.assign(new Error('Startup is already on your shortlist.'), { status: 409 });
    }
    throw error;
  }
}

export async function removeStartupFromShortlist(investorId, startupId) {
  if (!mongoose.isValidObjectId(startupId)) throw notFound();
  const removed = await Shortlist.findOneAndDelete({ investor: investorId, startup: startupId });
  if (!removed) throw notFound();
}
