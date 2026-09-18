import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  hireTeacherInputSchema,
  type HireTeacherInput,
  type Teacher,
} from '@english-school/shared';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { TeachersRepository } from './teachers.repository.js';

@Injectable()
export class TeachersService {
  constructor(
    private readonly teachers: TeachersRepository,
    private readonly users: UsersService,
  ) {}

  list() {
    return this.teachers.list();
  }

  async getById(id: string): Promise<Teacher> {
    const teacher = await this.teachers.findById(id);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  async hire(raw: HireTeacherInput): Promise<Teacher> {
    const input = hireTeacherInputSchema.parse(raw);
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('A person with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.teachers.hire({
      name: input.name,
      email,
      passwordHash,
      specializations: input.specializations ?? ['General'],
      hourlyRate: input.hourlyRate ?? 0,
      isNative: input.isNative ?? false,
      zoomPersonalLink: input.zoomPersonalLink ?? null,
    });
  }
}
