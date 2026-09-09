import { Router } from 'express';
import { LocationAPI } from './infrastructure/api/location.api';

export function createPublicLocationModule(): Router {
  const api = new LocationAPI();
  return api.router;
}
