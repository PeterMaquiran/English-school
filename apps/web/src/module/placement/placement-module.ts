import { apiClient } from '@/infra/http';
import { PlacementRepository } from './data/placement.repository';

export const placementRepository = new PlacementRepository(apiClient);
