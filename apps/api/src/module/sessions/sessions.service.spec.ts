import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';

const sessionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const studentId = '11111111-1111-1111-1111-111111111111';
const teacherId = '77777777-7777-7777-7777-777777777777';
const batchId = '55555555-5555-5555-5555-555555555555';
const endsAt = new Date('2026-09-01T19:30:00.000Z');

const sessions = {
  list: vi.fn(),
  findById: vi.fn(),
  updateStatus: vi.fn(),
  upsertAttendance: vi.fn(),
};
const enrollments = {
  listHoldingRoster: vi.fn(),
};
const teachers = {
  findByUserId: vi.fn(),
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: sessionId,
    batchId,
    teacherId,
    startsAt: new Date('2026-09-01T18:00:00.000Z'),
    endsAt,
    roomNumber: '12',
    meetingUrl: null,
    status: 'scheduled',
    createdAt: new Date('2026-08-01'),
    teacher: { user: { name: 'Jordan' } },
    batch: { scheduleLabel: 'Tue 18:00–19:30', course: { name: 'A2 Group' } },
    attendance: [],
    ...overrides,
  };
}

const teacherActor = {
  id: 'teacher-user',
  email: 'jordan@school.local',
  role: 'teacher' as const,
};

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    teachers.findByUserId.mockResolvedValue({ id: teacherId });
    enrollments.listHoldingRoster.mockResolvedValue([
      { studentId, studentName: 'Ada' },
    ]);
    service = new SessionsService(
      sessions as never,
      enrollments as never,
      teachers as never,
    );
  });

  it('records unmarked students as absent a day after class', async () => {
    sessions.findById.mockResolvedValue(row());

    const detail = await service.getDetail(
      sessionId,
      teacherActor,
      new Date('2026-09-02T19:30:00.000Z'),
    );

    expect(sessions.upsertAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ studentId, status: 'absent' }),
    );
    expect(detail.roster[0]?.status).toBe('absent');
  });

  it('locks attendance for a teacher after 48 hours', async () => {
    sessions.findById.mockResolvedValue(row());

    await expect(
      service.markAttendance(
        sessionId,
        { studentId, status: 'present' },
        teacherActor,
        new Date('2026-09-03T19:30:00.000Z'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets admin mark after the lock', async () => {
    sessions.findById.mockResolvedValue(row());
    sessions.upsertAttendance.mockResolvedValue({});

    await service.markAttendance(
      sessionId,
      { studentId, status: 'excused' },
      { id: 'admin', email: 'a@school.local', role: 'admin' },
      new Date('2026-09-03T19:30:00.000Z'),
    );

    expect(sessions.upsertAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'excused' }),
    );
  });
});
