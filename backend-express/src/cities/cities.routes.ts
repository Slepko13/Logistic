import { Router } from 'express';
import { citiesController } from './cities.controller';
import { validate } from '../common/middlewares/validate.middleware';
import { createCitySchema, updateCitySchema } from './cities.schema';
import { asyncHandler } from '../common/middlewares/async.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';

const router = Router();

// Застосовуємо аутентифікацію для всіх роутів міст
router.use(authenticate);

router.post(
  '/',
  authorize(['ADMIN']),
  validate(createCitySchema),
  asyncHandler(citiesController.create)
);

router.get(
  '/',
  asyncHandler(citiesController.findAll)
);

router.get(
  '/:id',
  asyncHandler(citiesController.findOne)
);

router.patch(
  '/:id',
  authorize(['ADMIN']),
  validate(updateCitySchema),
  asyncHandler(citiesController.update)
);

router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(citiesController.remove)
);

export default router;
