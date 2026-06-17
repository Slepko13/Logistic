import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    vehicle_id: z.number().int().positive('Invalid Vehicle ID'),
    departure_city: z.string().optional(),
    arrival_city: z.string().optional(),
    departure_date: z.string().datetime().optional(),
    arrival_date: z.string().datetime().optional(),
    status: z.string().optional().default('active'),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    vehicle_id: z.number().int().positive().optional(),
    departure_city: z.string().optional(),
    arrival_city: z.string().optional(),
    departure_date: z.string().datetime().optional(),
    arrival_date: z.string().datetime().optional(),
    status: z.string().optional(),
  }),
});

export type CreateTripInput = z.infer<typeof createTripSchema>['body'];
export type UpdateTripInput = z.infer<typeof updateTripSchema>['body'];
