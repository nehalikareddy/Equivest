import { addStartupToShortlist, listInvestorShortlist, removeStartupFromShortlist } from '../services/shortlistService.js';

export async function list(request, response, next) {
  try { response.json({ shortlist: await listInvestorShortlist(request.user._id) }); }
  catch (error) { next(error); }
}

export async function add(request, response, next) {
  try {
    const entry = await addStartupToShortlist(request.user._id, request.params.startupId);
    response.status(201).json({ shortlistItem: entry });
  } catch (error) { next(error); }
}

export async function remove(request, response, next) {
  try {
    await removeStartupFromShortlist(request.user._id, request.params.startupId);
    response.status(204).end();
  } catch (error) { next(error); }
}
