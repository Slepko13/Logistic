import { z } from 'zod';

export const createCitySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'City name must be at least 2 characters'),
  }),
});

export const updateCitySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'City name must be at least 2 characters'),
  }),
});

export type CreateCityInput = z.infer<typeof createCitySchema>['body'];
export type UpdateCityInput = z.infer<typeof updateCitySchema>['body'];
