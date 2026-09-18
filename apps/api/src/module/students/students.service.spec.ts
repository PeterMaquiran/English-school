import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service.js';

const studentId = '11111111-1111-1111-1111-111111111111';
const userId = '22222222-2222-2222-2222-222222222222';
const actorUserId = '33333333-3333-3333-3333-333333333333';

const students = {
  findById: vi.fn(),
  findByUserId: vi.fn(),
  create: vi.fn(),
  updateLevels: vi.fn(),
};
const users = {
  findById: vi.fn(),
};
const levelHistory = {
  append: vi.fn(),
};

function baseStudent(overrides: Record<string, unknown> = {}) {
  return {
    id: studentId,
    userId,
    cefrLevel: 'A2',
    targetLevel: 'B1',
    lessonCreditsRemaining: 0,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StudentsService(
      students as never,
      users as never,
      levelHistory as never,
    );
  });

  it('rejects a target below current CEFR', async () => {
    users.findById.mockResolvedValue({ id: userId, role: 'student' });
    students.findByUserId.mockResolvedValue(null);

    await expect(
      service.create({
        userId,
        cefrLevel: 'B1',
        targetLevel: 'A2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a student profile for a student user', async () => {
    users.findById.mockResolvedValue({ id: userId, role: 'student' });
    students.findByUserId.mockResolvedValue(null);
    students.create.mockResolvedValue(baseStudent({ cefrLevel: null }));

    await service.create({ userId });

    expect(students.create).toHaveBeenCalledWith({ userId });
  });

  it('refuses a second profile for the same user', async () => {
    users.findById.mockResolvedValue({ id: userId, role: 'student' });
    students.findByUserId.mockResolvedValue(baseStudent());

    await expect(service.create({ userId })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('records admin CEFR changes including downgrades', async () => {
    students.findById.mockResolvedValue(baseStudent());
    students.updateLevels.mockResolvedValue(baseStudent({ cefrLevel: 'A1' }));

    await service.adminAdjustCefr({
      studentId,
      toLevel: 'A1',
      actorUserId,
      reason: 'Misplaced diagnostic',
    });

    expect(levelHistory.append).toHaveBeenCalledWith({
      studentId,
      fromLevel: 'A2',
      toLevel: 'A1',
      source: 'admin',
      actorUserId,
    });
  });

  it('requires a reason for admin CEFR changes', async () => {
    await expect(
      service.adminAdjustCefr({
        studentId,
        toLevel: 'A1',
        actorUserId,
        reason: '   ',
      }),
    ).rejects.toThrow();
  });

  it('does not let an approved evaluation lower CEFR', async () => {
    students.findById.mockResolvedValue(baseStudent({ cefrLevel: 'B1' }));

    await expect(
      service.applyApprovedEvaluation({
        studentId,
        toLevel: 'A2',
        actorUserId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(levelHistory.append).not.toHaveBeenCalled();
  });

  it('raises CEFR from an approved evaluation', async () => {
    students.findById.mockResolvedValue(baseStudent({ cefrLevel: 'A2' }));
    students.updateLevels.mockResolvedValue(baseStudent({ cefrLevel: 'B1' }));

    await service.applyApprovedEvaluation({
      studentId,
      toLevel: 'B1',
      actorUserId,
    });

    expect(levelHistory.append).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'evaluation', toLevel: 'B1' }),
    );
  });
});
