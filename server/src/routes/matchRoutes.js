import { Router } from 'express';
import { matches } from '../controllers/investorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { matchFilterSchema } from '../validators/investorValidators.js';

const router = Router();
router.get('/', authenticate, authorizeRole('investor'), (request, _response, next) => {
  request.querySchema = matchFilterSchema;
  next();
}, matches);
export default router;
