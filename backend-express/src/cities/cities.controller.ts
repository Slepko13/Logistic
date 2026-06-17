import { Request, Response } from 'express';
import { citiesService } from './cities.service';

class CitiesController {
  async create(req: Request, res: Response) {
    const city = await citiesService.create(req.body);
    res.status(201).json(city);
  }

  async findAll(req: Request, res: Response) {
    const cities = await citiesService.findAll();
    res.json(cities);
  }

  async findOne(req: Request, res: Response) {
    const city = await citiesService.findOne(parseInt(req.params.id as string, 10));
    res.json(city);
  }

  async update(req: Request, res: Response) {
    const city = await citiesService.update(parseInt(req.params.id as string, 10), req.body);
    res.json(city);
  }

  async remove(req: Request, res: Response) {
    await citiesService.remove(parseInt(req.params.id as string, 10));
    res.status(204).send();
  }
}

export const citiesController = new CitiesController();
