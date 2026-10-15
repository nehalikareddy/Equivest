import mongoose from 'mongoose';
import Shortlist from '../models/Shortlist.js';
import Startup from '../models/Startup.js';
import { toPublicStartup } from './startupService.js';

const notFound = () => Object.assign(new Error('Startup not found.'), { status: 404 });

export async function listInvestorShortlist(investorId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;
  const filter = { investor: investorId };
  const [entries, total] = await Promise.all([
    Shortlist.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(safeLimit).populate('startup'),
    Shortlist.countDocuments(filter)
  ]);
  const saved = entries.filter((entry) => entry.startup);
  return {
    shortlist: saved.map((entry) => ({
      id: entry._id.toString(),
      addedAt: entry.createdAt,
      startup: toPublicStartup(entry.startup)
    })),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) }
  };
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