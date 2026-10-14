import { Router } from 'express';
import { analyze, create, getById, listMine, remove, update } from '../controllers/startupController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { startupSchema } from '../validators/startupValidators.js';

const router = Router();
const founderOnly = [authenticate, authorizeRole('founder')];

router.post('/', ...founderOnly, validateRequest(startupSchema), create);
router.get('/mine', ...founderOnly, listMine);
router.post('/:id/analyze', ...founderOnly, analyze);
router.get('/:id', authenticate, getById);
router.put('/:id', ...founderOnly, validateRequest(startupSchema), update);
router.delete('/:id', ...founderOnly, remove);

export default router;
