import InvestorProfile from '../models/InvestorProfile.js';
import Startup from '../models/Startup.js';
import { toPublicStartup } from './startupService.js';
import { rankStartups } from './matchingService.js';

export function toPublicProfile(profile) {
  return {
    industries: profile.industries,
    stages: profile.stages,
    minTicket: profile.minTicket,
    maxTicket: profile.maxTicket,
    updatedAt: profile.updatedAt
  };
}

export async function getOrCreateInvestorProfile(userId) {
  let profile = await InvestorProfile.findOne({ user: userId });
  if (profile) return profile;
  try {
    profile = await InvestorProfile.create({ user: userId });
  } catch (error) {
    if (error.code !== 11000) throw error;
    profile = await InvestorProfile.findOne({ user: userId });
  }
  return profile;
}

export async function updateInvestorProfile(userId, fields) {
  const profile = await InvestorProfile.findOneAndUpdate(
    { user: userId },
    { $set: fields, $setOnInsert: { user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return toPublicProfile(profile);
}

export async function findMatches(userId, filters) {
  const profile = await getOrCreateInvestorProfile(userId);
  const startupFilters = {};
  if (filters.industry) startupFilters.industry = filters.industry;
  if (filters.stage) startupFilters.stage = filters.stage;
  const startups = await Startup.find(startupFilters);
  const ranked = rankStartups(startups, profile);
  if (filters.sort === 'amount') {
    ranked.sort((left, right) => left.startup.amountSought - right.startup.amountSought
      || left.startup.name.localeCompare(right.startup.name, 'en', { sensitivity: 'base' }));
  }
  return {
    preferences: toPublicProfile(profile),
    matches: ranked.map(({ startup, score, reasons }) => ({ startup: toPublicStartup(startup), score, reasons }))
  };
}
