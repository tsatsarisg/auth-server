import { Router } from 'express';
import { signin } from './user.auth.js';
import { findOne, createOne } from './user.controller.js';

const router = Router();

router.get('/:id', findOne);
router.post('/create', createOne);
router.post('/login', signin);

export default router;
