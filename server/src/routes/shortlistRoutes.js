import { Router } from 'express';
import { add, list, remove } from '../controllers/shortlistController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = Router();
router.use(authenticate, authorizeRole('investor'));
router.get('/', list);
router.post('/:startupId', add);
router.delete('/:startupId', remove);
export default router;
