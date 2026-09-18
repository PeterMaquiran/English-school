import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ZodError, type ZodType } from 'zod';
import {
  createBatchInputSchema,
  createCourseInputSchema,
  type CreateBatchInput,
  type CreateCourseInput,
} from '@english-school/shared';
import { TeachersRepository } from '../teachers/teachers.repository.js';
import { CoursesRepository } from './courses.repository.js';

function parseBody<T>(schema: ZodType<T>, raw: unknown): T {
  try {
    return schema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(
        error.issues[0]?.message ?? 'Invalid input',
      );
    }
    throw error;
  }
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly courses: CoursesRepository,
    private readonly teachers: TeachersRepository,
  ) {}

  listCourses() {
    return this.courses.listCourses();
  }

  async getCourse(id: string) {
    const course = await this.courses.findCourseById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  createCourse(raw: CreateCourseInput) {
    const input = parseBody(createCourseInputSchema, {
      ...raw,
      courseType: raw.courseType ?? 'group',
    });
    return this.courses.createCourse({
      ...input,
      defaultCapacity:
        input.courseType === 'private' ? 1 : input.defaultCapacity,
    });
  }

  listBatches(courseId?: string) {
    return this.courses.listBatches(courseId);
  }

  async getBatch(id: string) {
    const batch = await this.courses.findBatchById(id);
    if (!batch) {
      throw new NotFoundException('Class not found');
    }
    return batch;
  }

  async createBatch(courseId: string, raw: CreateBatchInput) {
    const course = await this.getCourse(courseId);
    const input = parseBody(createBatchInputSchema, raw);
    const teacher = await this.teachers.findById(input.teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    if (
      !teacher.specializations.some(
        (item) => item.toLowerCase() === course.specialization.toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        `This teacher does not teach ${course.specialization}`,
      );
    }

    const meetingUrl = input.meetingUrl || teacher.zoomPersonalLink || null;
    const roomNumber = input.roomNumber ?? null;
    if (!roomNumber && !meetingUrl) {
      throw new BadRequestException(
        'Add a room or a meeting link. You can also save a Zoom link on the teacher.',
      );
    }

    const capacity = input.capacity ?? course.defaultCapacity;
    return this.courses.createBatch(courseId, {
      ...input,
      roomNumber,
      meetingUrl,
      capacity,
    });
  }
}
