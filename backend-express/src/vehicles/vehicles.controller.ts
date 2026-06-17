import { Request, Response } from 'express';
import { vehiclesService } from './vehicles.service';

class VehiclesController {
  async create(req: Request, res: Response) {
    const vehicle = await vehiclesService.create(req.body);
    res.status(201).json(vehicle);
  }

  async findAll(req: Request, res: Response) {
    const vehicles = await vehiclesService.findAll();
    res.json(vehicles);
  }

  async findOne(req: Request, res: Response) {
    const vehicle = await vehiclesService.findOne(parseInt(req.params.id as string, 10));
    res.json(vehicle);
  }

  async update(req: Request, res: Response) {
    const vehicle = await vehiclesService.update(parseInt(req.params.id as string, 10), req.body);
    res.json(vehicle);
  }

  async remove(req: Request, res: Response) {
    await vehiclesService.remove(parseInt(req.params.id as string, 10));
    res.status(204).send();
  }
}

export const vehiclesController = new VehiclesController();
