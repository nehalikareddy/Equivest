import {
  createStartup, deleteFounderStartup, getStartup, listFounderStartups, updateFounderStartup
} from '../services/startupService.js';
import { analyzeStartupPitch } from '../services/pitchAnalysisService.js';

export async function create(request, response, next) {
  try {
    response.status(201).json({ startup: await createStartup(request.user._id, request.validatedBody) });
  } catch (error) { next(error); }
}

export async function listMine(request, response, next) {
  try {
    const result = await listFounderStartups(request.user._id, request.query);
    response.json(result);
  } catch (error) { next(error); }
}

export async function getById(request, response, next) {
  try { response.json({ startup: await getStartup(request.params.id, request.user) }); }
  catch (error) { next(error); }
}

export async function update(request, response, next) {
  try {
    response.json({ startup: await updateFounderStartup(request.params.id, request.user._id, request.validatedBody) });
  } catch (error) { next(error); }
}

export async function remove(request, response, next) {
  try {
    await deleteFounderStartup(request.params.id, request.user._id);
    response.status(204).end();
  } catch (error) { next(error); }
}

export async function analyze(request, response, next) {
  try {
    const startup = await getStartup(request.params.id, request.user);
    response.json({ analysis: await analyzeStartupPitch(startup.pitch) });
  } catch (error) { next(error); }
}