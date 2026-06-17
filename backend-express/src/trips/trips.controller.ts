import { Request, Response } from 'express';
import { tripsService } from './trips.service';

class TripsController {
  async create(req: Request, res: Response) {
    const trip = await tripsService.create(req.body);
    res.status(201).json(trip);
  }

  async findAll(req: Request, res: Response) {
    const trips = await tripsService.findAll();
    res.json(trips);
  }

  async findOne(req: Request, res: Response) {
    const trip = await tripsService.findOne(parseInt(req.params.id as string, 10));
    res.json(trip);
  }

  async update(req: Request, res: Response) {
    const trip = await tripsService.update(parseInt(req.params.id as string, 10), req.body);
    res.json(trip);
  }

  async remove(req: Request, res: Response) {
    await tripsService.remove(parseInt(req.params.id as string, 10));
    res.status(204).send();
  }
}

export const tripsController = new TripsController();
