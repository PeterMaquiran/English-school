import { apiClient } from '@/infra/http';
import { StudentsRepository } from './data/students.repository';

export const studentsRepository = new StudentsRepository(apiClient);
