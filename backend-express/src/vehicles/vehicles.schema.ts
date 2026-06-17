import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    plate_number: z.string().optional(),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    plate_number: z.string().optional(),
  }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>['body'];
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>['body'];
