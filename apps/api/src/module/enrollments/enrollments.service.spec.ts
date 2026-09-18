import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';

const studentId = '11111111-1111-1111-1111-111111111111';
const batchId = '55555555-5555-5555-5555-555555555555';

const enrollments = {
  listForBatch: vi.fn(),
  listForStudent: vi.fn(),
  findById: vi.fn(),
  findOpenSeat: vi.fn(),
  countSeats: vi.fn(),
  createSeat: vi.fn(),
  collectInvoice: vi.fn(),
  findInvoice: vi.fn(),
};
const students = {
  findById: vi.fn(),
};
const courses = {
  findBatchById: vi.fn(),
};

function student(overrides: Record<string, unknown> = {}) {
  return {
    id: studentId,
    userId: '22222222-2222-2222-2222-222222222222',
    name: 'Ada',
    email: 'ada@school.local',
    cefrLevel: 'A2',
    targetLevel: 'B1',
    lessonCreditsRemaining: 0,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function batch(overrides: Record<string, unknown> = {}) {
  return {
    id: batchId,
    courseId: '66666666-6666-6666-6666-666666666666',
    teacherId: '77777777-7777-7777-7777-777777777777',
    teacherName: 'Jordan',
    courseName: 'A2 Group',
    cefrLevel: 'A2',
    courseType: 'group',
    scheduleLabel: 'Tue 18:00',
    weekdays: [2],
    startTime: '18:00',
    endTime: '19:00',
    roomNumber: '2',
    meetingUrl: null,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-12-01'),
    capacity: 2,
    seatsTaken: 0,
    tuitionAmount: 400,
    currency: 'USD',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EnrollmentsService(
      enrollments as never,
      students as never,
      courses as never,
    );
  });

  it('refuses a seat before placement', async () => {
    courses.findBatchById.mockResolvedValue(batch());
    students.findById.mockResolvedValue(student({ cefrLevel: null }));

    await expect(service.seat(batchId, { studentId })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires a reason one level above', async () => {
    courses.findBatchById.mockResolvedValue(batch({ cefrLevel: 'B1' }));
    students.findById.mockResolvedValue(student({ cefrLevel: 'A2' }));

    await expect(service.seat(batchId, { studentId })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('blocks more than one level above', async () => {
    courses.findBatchById.mockResolvedValue(batch({ cefrLevel: 'B2' }));
    students.findById.mockResolvedValue(student({ cefrLevel: 'A2' }));

    await expect(
      service.seat(batchId, { studentId, overrideReason: 'Eager' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('holds a seat pending payment', async () => {
    courses.findBatchById.mockResolvedValue(batch());
    students.findById.mockResolvedValue(student());
    enrollments.findOpenSeat.mockResolvedValue(null);
    enrollments.countSeats.mockResolvedValue(0);
    enrollments.createSeat.mockResolvedValue({ id: 'enroll' });

    await service.seat(batchId, { studentId });

    expect(enrollments.createSeat).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_payment',
        amount: 400,
      }),
    );
  });

  it('activates immediately when pay later is used', async () => {
    courses.findBatchById.mockResolvedValue(batch());
    students.findById.mockResolvedValue(student());
    enrollments.findOpenSeat.mockResolvedValue(null);
    enrollments.countSeats.mockResolvedValue(0);
    enrollments.createSeat.mockResolvedValue({ id: 'enroll' });

    await service.seat(batchId, { studentId, payLater: true });

    expect(enrollments.createSeat).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('refuses a full class', async () => {
    courses.findBatchById.mockResolvedValue(batch({ capacity: 1 }));
    students.findById.mockResolvedValue(student());
    enrollments.findOpenSeat.mockResolvedValue(null);
    enrollments.countSeats.mockResolvedValue(1);

    await expect(service.seat(batchId, { studentId })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
