import mongoose from 'mongoose';
import Startup from '../models/Startup.js';
import Shortlist from '../models/Shortlist.js';

const notFound = () => Object.assign(new Error('Startup not found.'), { status: 404 });

export function toPublicStartup(startup) {
  return {
    id: startup._id.toString(),
    name: startup.name,
    tagline: startup.tagline,
    pitch: startup.pitch,
    industry: startup.industry,
    stage: startup.stage,
    amountSought: startup.amountSought,
    location: startup.location,
    businessModel: startup.businessModel,
    website: startup.website,
    createdAt: startup.createdAt,
    updatedAt: startup.updatedAt
  };
}

export async function createStartup(founderId, fields) {
  const startup = await Startup.create({ ...fields, founder: founderId });
  return toPublicStartup(startup);
}

export async function listFounderStartups(founderId) {
  const startups = await Startup.find({ founder: founderId }).sort({ createdAt: -1, _id: 1 });
  return startups.map(toPublicStartup);
}

export async function getStartup(id, user) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const startup = await Startup.findById(id);
  if (!startup || (user.role === 'founder' && startup.founder.toString() !== user._id.toString())) throw notFound();
  return toPublicStartup(startup);
}

export async function updateFounderStartup(id, founderId, fields) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const startup = await Startup.findOneAndUpdate(
    { _id: id, founder: founderId },
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!startup) throw notFound();
  return toPublicStartup(startup);
}

export async function deleteFounderStartup(id, founderId) {
  if (!mongoose.isValidObjectId(id)) throw notFound();
  const startup = await Startup.findOneAndDelete({ _id: id, founder: founderId });
  if (!startup) throw notFound();
  await Shortlist.deleteMany({ startup: startup._id });
}
