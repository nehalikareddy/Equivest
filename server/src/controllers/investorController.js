import { findMatches, getOrCreateInvestorProfile, toPublicProfile, updateInvestorProfile } from '../services/investorService.js';

export async function getProfile(request, response, next) {
  try {
    const profile = await getOrCreateInvestorProfile(request.user._id);
    response.json({ profile: toPublicProfile(profile) });
  } catch (error) { next(error); }
}

export async function putProfile(request, response, next) {
  try {
    response.json({ profile: await updateInvestorProfile(request.user._id, request.validatedBody) });
  } catch (error) { next(error); }
}

export async function matches(request, response, next) {
  const parsed = request.querySchema.safeParse(request.query);
  if (!parsed.success) {
    const error = Object.assign(new Error('Invalid match filters.'), { status: 400 });
    error.details = parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
    return next(error);
  }
  try { response.json(await findMatches(request.user._id, parsed.data)); }
  catch (error) { next(error); }
}
