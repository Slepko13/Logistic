import { Router } from 'express';
import { tripsController } from './trips.controller';
import { validate } from '../common/middlewares/validate.middleware';
import { createTripSchema, updateTripSchema } from './trips.schema';
import { asyncHandler } from '../common/middlewares/async.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(['ADMIN', 'MANAGER']),
  validate(createTripSchema),
  asyncHandler(tripsController.create)
);

router.get(
  '/',
  asyncHandler(tripsController.findAll)
);

router.get(
  '/:id',
  asyncHandler(tripsController.findOne)
);

router.patch(
  '/:id',
  authorize(['ADMIN', 'MANAGER']),
  validate(updateTripSchema),
  asyncHandler(tripsController.update)
);

router.delete(
  '/:id',
  authorize(['ADMIN', 'MANAGER']),
  asyncHandler(tripsController.remove)
);

export default router;
