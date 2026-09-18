import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  listGroupSessionWindows,
  type Batch,
  type Course,
  type CreateBatchInput,
  type CreateCourseInput,
  type EnrollmentStatus,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';

const holdingStatuses: EnrollmentStatus[] = ['pending_payment', 'active'];

const batchInclude = {
  course: true,
  teacher: { include: { user: true } },
  _count: {
    select: {
      enrollments: {
        where: { status: { in: holdingStatuses } },
      },
    },
  },
};

type BatchRow = Prisma.BatchGetPayload<{ include: typeof batchInclude }>;

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toCourse);
  }

  async findCourseById(id: string): Promise<Course | null> {
    const row = await this.prisma.course.findUnique({ where: { id } });
    return row ? toCourse(row) : null;
  }

  async createCourse(input: CreateCourseInput): Promise<Course> {
    const row = await this.prisma.course.create({
      data: {
        name: input.name,
        courseType: input.courseType,
        cefrLevel: input.cefrLevel,
        specialization: input.specialization ?? 'General',
        defaultCapacity: input.defaultCapacity,
        tuitionAmount: input.tuitionAmount,
        currency: input.currency ?? 'USD',
      },
    });
    return toCourse(row);
  }

  async listBatches(courseId?: string): Promise<Batch[]> {
    const rows = await this.prisma.batch.findMany({
      where: courseId ? { courseId } : undefined,
      include: batchInclude,
      orderBy: { startDate: 'asc' },
    });
    return rows.map(toBatch);
  }

  async findBatchById(id: string): Promise<Batch | null> {
    const row = await this.prisma.batch.findUnique({
      where: { id },
      include: batchInclude,
    });
    return row ? toBatch(row) : null;
  }

  async createBatch(
    courseId: string,
    input: CreateBatchInput & { capacity: number; scheduleLabel: string },
  ): Promise<Batch> {
    const holidays = await this.prisma.schoolHoliday.findMany();
    const windows = listGroupSessionWindows({
      startDate: input.startDate,
      endDate: input.endDate,
      weekdays: input.weekdays,
      startTime: input.startTime,
      endTime: input.endTime,
      holidays: holidays.map((row) => row.observedOn),
    });

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({
        data: {
          courseId,
          teacherId: input.teacherId,
          scheduleLabel: input.scheduleLabel,
          weekdays: input.weekdays,
          startTime: input.startTime,
          endTime: input.endTime,
          roomNumber: input.roomNumber ?? null,
          meetingUrl: input.meetingUrl ?? null,
          startDate: input.startDate,
          endDate: input.endDate,
          capacity: input.capacity,
        },
      });
      if (windows.length > 0) {
        await tx.lessonSession.createMany({
          data: windows.map((window) => ({
            batchId: created.id,
            teacherId: input.teacherId,
            startsAt: window.startsAt,
            endsAt: window.endsAt,
            roomNumber: input.roomNumber ?? null,
            meetingUrl: input.meetingUrl ?? null,
            status: 'scheduled',
          })),
        });
      }
      return tx.batch.findUniqueOrThrow({
        where: { id: created.id },
        include: batchInclude,
      });
    });
    return toBatch(row);
  }
}

function toCourse(row: {
  id: string;
  name: string;
  courseType: Course['courseType'];
  cefrLevel: Course['cefrLevel'];
  specialization: string;
  defaultCapacity: number;
  tuitionAmount: Prisma.Decimal;
  currency: string;
  createdAt: Date;
}): Course {
  return {
    id: row.id,
    name: row.name,
    courseType: row.courseType,
    cefrLevel: row.cefrLevel,
    specialization: row.specialization,
    defaultCapacity: row.defaultCapacity,
    tuitionAmount: decimalToNumber(row.tuitionAmount),
    currency: row.currency,
    createdAt: row.createdAt,
  };
}

function toBatch(row: BatchRow): Batch {
  return {
    id: row.id,
    courseId: row.courseId,
    teacherId: row.teacherId,
    teacherName: row.teacher.user.name,
    courseName: row.course.name,
    cefrLevel: row.course.cefrLevel,
    courseType: row.course.courseType,
    scheduleLabel: row.scheduleLabel,
    weekdays: row.weekdays,
    startTime: row.startTime,
    endTime: row.endTime,
    roomNumber: row.roomNumber,
    meetingUrl: row.meetingUrl,
    startDate: row.startDate,
    endDate: row.endDate,
    capacity: row.capacity,
    seatsTaken: row._count.enrollments,
    tuitionAmount: decimalToNumber(row.course.tuitionAmount),
    currency: row.course.currency,
    createdAt: row.createdAt,
  };
}
