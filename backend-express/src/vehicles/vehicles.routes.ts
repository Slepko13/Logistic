import { Router } from 'express';
import { vehiclesController } from './vehicles.controller';
import { validate } from '../common/middlewares/validate.middleware';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.schema';
import { asyncHandler } from '../common/middlewares/async.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(['ADMIN', 'MANAGER']),
  validate(createVehicleSchema),
  asyncHandler(vehiclesController.create)
);

router.get(
  '/',
  asyncHandler(vehiclesController.findAll)
);

router.get(
  '/:id',
  asyncHandler(vehiclesController.findOne)
);

router.patch(
  '/:id',
  authorize(['ADMIN', 'MANAGER']),
  validate(updateVehicleSchema),
  asyncHandler(vehiclesController.update)
);

router.delete(
  '/:id',
  authorize(['ADMIN', 'MANAGER']),
  asyncHandler(vehiclesController.remove)
);

export default router;
