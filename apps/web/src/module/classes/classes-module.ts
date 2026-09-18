import { apiClient } from '@/infra/http';
import { ClassesRepository } from './data/classes.repository';

export const classesRepository = new ClassesRepository(apiClient);
