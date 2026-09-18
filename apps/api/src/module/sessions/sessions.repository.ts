import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AttendanceStatus,
  LessonSession,
  LessonSessionStatus,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

const sessionInclude = {
  teacher: { include: { user: true } },
  batch: { include: { course: true } },
  attendance: true,
} as const;

type SessionRow = Prisma.LessonSessionGetPayload<{
  include: typeof sessionInclude;
}>;

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: {
    from?: Date;
    to?: Date;
    teacherId?: string;
    batchId?: string;
  }): Promise<LessonSession[]> {
    const rows = await this.prisma.lessonSession.findMany({
      where: {
        startsAt:
          input.from || input.to
            ? {
                gte: input.from,
                lte: input.to,
              }
            : undefined,
        teacherId: input.teacherId,
        batchId: input.batchId,
      },
      include: sessionInclude,
      orderBy: { startsAt: 'asc' },
    });
    return rows.map(toSession);
  }

  async findById(id: string): Promise<SessionRow | null> {
    return this.prisma.lessonSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
  }

  async updateStatus(id: string, status: LessonSessionStatus) {
    const row = await this.prisma.lessonSession.update({
      where: { id },
      data: { status },
      include: sessionInclude,
    });
    return toSession(row);
  }

  async upsertAttendance(input: {
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    markedByUserId: string | null;
  }) {
    return this.prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: input.sessionId,
          studentId: input.studentId,
        },
      },
      create: {
        sessionId: input.sessionId,
        studentId: input.studentId,
        status: input.status,
        markedByUserId: input.markedByUserId,
      },
      update: {
        status: input.status,
        markedAt: new Date(),
        markedByUserId: input.markedByUserId,
      },
    });
  }
}

export function toSession(row: SessionRow): LessonSession {
  return {
    id: row.id,
    batchId: row.batchId,
    teacherId: row.teacherId,
    teacherName: row.teacher.user.name,
    courseName: row.batch?.course.name ?? null,
    scheduleLabel: row.batch?.scheduleLabel ?? null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    roomNumber: row.roomNumber,
    meetingUrl: row.meetingUrl,
    status: row.status,
    createdAt: row.createdAt,
  };
}
