import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  attendanceIsLocked,
  markAttendanceInputSchema,
  unmarkedShouldBecomeAbsent,
  updateSessionStatusInputSchema,
  type LessonSession,
  type LessonSessionDetail,
  type MarkAttendanceInput,
  type UpdateSessionStatusInput,
} from '@english-school/shared';
import { parseBody } from '../../shared/http/parse-body.js';
import type { JwtUser } from '../../types/express.js';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository.js';
import { TeachersRepository } from '../teachers/teachers.repository.js';
import { SessionsRepository, toSession } from './sessions.repository.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessions: SessionsRepository,
    private readonly enrollments: EnrollmentsRepository,
    private readonly teachers: TeachersRepository,
  ) {}

  async list(
    actor: JwtUser,
    query: { from?: string; to?: string; batchId?: string },
  ): Promise<LessonSession[]> {
    const now = new Date();
    const from = query.from
      ? new Date(query.from)
      : query.batchId
        ? undefined
        : startOfUtcDay(now);
    const to = query.to
      ? new Date(query.to)
      : query.batchId
        ? undefined
        : new Date((from ?? now).getTime() + 28 * 24 * 60 * 60 * 1000);
    if (
      (from && Number.isNaN(from.getTime())) ||
      (to && Number.isNaN(to.getTime()))
    ) {
      throw new BadRequestException('Use valid from and to dates');
    }

    let teacherId: string | undefined;
    if (actor.role === 'teacher') {
      const teacher = await this.teachers.findByUserId(actor.id);
      if (!teacher) {
        throw new NotFoundException('Teacher profile not found');
      }
      teacherId = teacher.id;
    }

    return this.sessions.list({
      from,
      to,
      teacherId,
      batchId: query.batchId,
    });
  }

  async getDetail(
    id: string,
    actor: JwtUser,
    now = new Date(),
  ): Promise<LessonSessionDetail> {
    const row = await this.requireSession(id, actor);
    const roster = row.batchId
      ? await this.enrollments.listHoldingRoster(row.batchId)
      : [];
    const byStudent = new Map(
      row.attendance.map((item) => [item.studentId, item.status] as const),
    );

    if (
      unmarkedShouldBecomeAbsent(row.endsAt, now) &&
      row.status !== 'cancelled'
    ) {
      for (const seat of roster) {
        if (!byStudent.has(seat.studentId)) {
          await this.sessions.upsertAttendance({
            sessionId: row.id,
            studentId: seat.studentId,
            status: 'absent',
            markedByUserId: null,
          });
          byStudent.set(seat.studentId, 'absent');
        }
      }
    }

    return {
      ...toSession(row),
      attendanceLocked: attendanceIsLocked(row.endsAt, now),
      roster: roster.map((seat) => ({
        studentId: seat.studentId,
        studentName: seat.studentName,
        status: byStudent.get(seat.studentId) ?? null,
      })),
    };
  }

  async updateStatus(
    id: string,
    raw: UpdateSessionStatusInput,
    actor: JwtUser,
  ): Promise<LessonSession> {
    const input = parseBody(updateSessionStatusInputSchema, raw);
    const row = await this.requireSession(id, actor);
    if (row.status === 'cancelled' && actor.role !== 'admin') {
      throw new BadRequestException('Only admin can reopen a cancelled class');
    }
    return this.sessions.updateStatus(id, input.status);
  }

  async markAttendance(
    id: string,
    raw: MarkAttendanceInput,
    actor: JwtUser,
    now = new Date(),
  ): Promise<LessonSessionDetail> {
    const input = parseBody(markAttendanceInputSchema, raw);
    const row = await this.requireSession(id, actor);
    if (row.status === 'cancelled') {
      throw new BadRequestException('This class was cancelled');
    }
    if (attendanceIsLocked(row.endsAt, now) && actor.role !== 'admin') {
      throw new BadRequestException(
        'Attendance is locked. Only admin can change it now.',
      );
    }

    const roster = row.batchId
      ? await this.enrollments.listHoldingRoster(row.batchId)
      : [];
    if (!roster.some((seat) => seat.studentId === input.studentId)) {
      throw new BadRequestException('This student does not have a seat');
    }

    await this.sessions.upsertAttendance({
      sessionId: row.id,
      studentId: input.studentId,
      status: input.status,
      markedByUserId: actor.id,
    });
    return this.getDetail(id, actor, now);
  }

  private async requireSession(id: string, actor: JwtUser) {
    const row = await this.sessions.findById(id);
    if (!row) {
      throw new NotFoundException('Class session not found');
    }
    if (actor.role === 'teacher') {
      const teacher = await this.teachers.findByUserId(actor.id);
      if (!teacher || teacher.id !== row.teacherId) {
        throw new ForbiddenException();
      }
    }
    return row;
  }
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}
