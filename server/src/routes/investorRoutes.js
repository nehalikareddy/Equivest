import { Router } from 'express';
import { getProfile, putProfile } from '../controllers/investorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { investorProfileSchema } from '../validators/investorValidators.js';

const router = Router();
router.use(authenticate, authorizeRole('investor'));
router.get('/profile', getProfile);
router.put('/profile', validateRequest(investorProfileSchema), putProfile);
export default router;
