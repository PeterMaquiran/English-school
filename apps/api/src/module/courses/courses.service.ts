import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createBatchInputSchema,
  createCourseInputSchema,
  formatScheduleLabel,
  type CreateBatchInput,
  type CreateCourseInput,
} from '@english-school/shared';
import { parseBody } from '../../shared/http/parse-body.js';
import { TeachersRepository } from '../teachers/teachers.repository.js';
import { CoursesRepository } from './courses.repository.js';

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
    }) as CreateCourseInput;
    const courseType = input.courseType ?? 'group';
    return this.courses.createCourse({
      ...input,
      courseType,
      defaultCapacity: courseType === 'private' ? 1 : input.defaultCapacity,
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
    const input = parseBody(createBatchInputSchema, raw) as CreateBatchInput;
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
      scheduleLabel: formatScheduleLabel(
        input.weekdays,
        input.startTime,
        input.endTime,
      ),
      roomNumber,
      meetingUrl,
      capacity,
    });
  }
}
