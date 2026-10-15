import { STARTUP_STAGES } from '../constants/startupOptions.js';

// Note: For a high-volume production system, pre-filter by industry/stage in the DB query
// and paginate results. In-memory scoring is used here for deterministic assessment evaluation.
function amountPoints(amount, minimum, maximum) {
  if (![amount, minimum, maximum].every(Number.isFinite) || amount <= 0 || minimum < 0 || maximum <= 0 || minimum > maximum) return 0;
  if (amount >= minimum && amount <= maximum) return 30;
  if (amount < minimum) return minimum > 0 && (minimum - amount) / minimum <= 0.25 ? 15 : 0;
  return (amount - maximum) / maximum <= 0.25 ? 15 : 0;
}

export function scoreStartup(startup, preferences = {}) {
  const industries = Array.isArray(preferences.industries) ? preferences.industries : [];
  const stages = Array.isArray(preferences.stages) ? preferences.stages : [];
  const industryMatched = industries.includes(startup.industry);
  const preferredStageIndex = STARTUP_STAGES.indexOf(startup.stage);
  const exactStage = stages.includes(startup.stage);
  const adjacentStage = !exactStage && preferredStageIndex >= 0 && stages.some((stage) => {
    const preferredIndex = STARTUP_STAGES.indexOf(stage);
    return preferredIndex >= 0 && Math.abs(preferredIndex - preferredStageIndex) === 1;
  });
  const stagePoints = exactStage ? 30 : adjacentStage ? 15 : 0;
  const amountScore = amountPoints(Number(startup.amountSought), Number(preferences.minTicket), Number(preferences.maxTicket));
  const reasons = [
    {
      criterion: 'industry', matched: industryMatched, points: industryMatched ? 40 : 0,
      message: industryMatched ? 'Matches your preferred industry' : 'Industry is outside your preferences'
    },
    {
      criterion: 'stage', matched: stagePoints > 0, points: stagePoints,
      message: exactStage ? 'Matches your preferred funding stage' : adjacentStage ? 'Funding stage is adjacent to your preference' : 'Funding stage is outside your preferences'
    },
    {
      criterion: 'amount', matched: amountScore > 0, points: amountScore,
      message: amountScore === 30 ? 'Funding request is within your investment range' : amountScore === 15 ? 'Funding request is close to your investment range' : 'Funding request is outside your investment range'
    }
  ];
  const score = Math.max(0, Math.min(100, reasons.reduce((total, reason) => total + reason.points, 0)));
  return { score, reasons };
}

export function rankStartups(startups, preferences) {
  return startups.map((startup) => ({ startup, ...scoreStartup(startup, preferences) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftName = String(left.startup.name || '').toLowerCase();
      const rightName = String(right.startup.name || '').toLowerCase();
      if (leftName !== rightName) return leftName < rightName ? -1 : 1;
      const leftId = String(left.startup.id || left.startup._id || '');
      const rightId = String(right.startup.id || right.startup._id || '');
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
}