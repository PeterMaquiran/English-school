import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PlacementTestsService } from './placement-tests.service.js';

const studentId = '11111111-1111-1111-1111-111111111111';
const testId = '44444444-4444-4444-4444-444444444444';
const actorUserId = '33333333-3333-3333-3333-333333333333';

const tests = {
  findById: vi.fn(),
  listByStudentId: vi.fn(),
  create: vi.fn(),
  confirmAndApplyLevel: vi.fn(),
};
const students = {
  findById: vi.fn(),
};
const bands = {
  recommendLevel: vi.fn(),
};
const history = {
  listByStudentId: vi.fn(),
};

function student(overrides: Record<string, unknown> = {}) {
  return {
    id: studentId,
    userId: '22222222-2222-2222-2222-222222222222',
    name: 'Ada Student',
    email: 'ada@school.local',
    cefrLevel: 'A2' as const,
    targetLevel: 'B2' as const,
    lessonCreditsRemaining: 0,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function placementTest(overrides: Record<string, unknown> = {}) {
  return {
    id: testId,
    studentId,
    takenAt: new Date('2026-03-01'),
    listening: 70,
    reading: 72,
    writing: 68,
    speaking: 71,
    overall: 70,
    recommendedLevel: 'B1' as const,
    confirmedAt: null,
    confirmedByUserId: null,
    notes: null,
    ...overrides,
  };
}

describe('PlacementTestsService', () => {
  let service: PlacementTestsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PlacementTestsService(
      tests as never,
      students as never,
      bands as never,
      history as never,
    );
  });

  it('stores recommended CEFR from score bands', async () => {
    students.findById.mockResolvedValue(student({ cefrLevel: null }));
    bands.recommendLevel.mockResolvedValue('B1');
    tests.create.mockResolvedValue(placementTest());

    await service.record({
      studentId,
      takenAt: new Date('2026-03-01'),
      overall: 70,
    });

    expect(tests.create).toHaveBeenCalledWith(
      expect.objectContaining({ recommendedLevel: 'B1', overall: 70 }),
    );
  });

  it('does not change level until the test is confirmed', async () => {
    students.findById.mockResolvedValue(student({ cefrLevel: null }));
    bands.recommendLevel.mockResolvedValue('A1');
    tests.create.mockResolvedValue(placementTest({ recommendedLevel: 'A1' }));

    await service.record({
      studentId,
      takenAt: new Date('2026-03-01'),
      overall: 10,
    });

    expect(tests.confirmAndApplyLevel).not.toHaveBeenCalled();
  });

  it('confirms a first placement and writes history', async () => {
    tests.findById.mockResolvedValue(placementTest({ recommendedLevel: 'A2' }));
    students.findById.mockResolvedValue(student({ cefrLevel: null }));
    tests.confirmAndApplyLevel.mockResolvedValue(
      placementTest({ confirmedAt: new Date() }),
    );

    await service.confirm({ placementTestId: testId, actorUserId });

    expect(tests.confirmAndApplyLevel).toHaveBeenCalledWith(
      expect.objectContaining({
        writeHistory: true,
        fromLevel: null,
        toLevel: 'A2',
      }),
    );
  });

  it('raises CEFR when a confirmed test recommends a higher level', async () => {
    tests.findById.mockResolvedValue(placementTest({ recommendedLevel: 'B1' }));
    students.findById.mockResolvedValue(student({ cefrLevel: 'A2' }));
    tests.confirmAndApplyLevel.mockResolvedValue(placementTest());

    await service.confirm({ placementTestId: testId, actorUserId });

    expect(tests.confirmAndApplyLevel).toHaveBeenCalledWith(
      expect.objectContaining({ writeHistory: true, toLevel: 'B1' }),
    );
  });

  it('refuses to confirm a lower recommended level', async () => {
    tests.findById.mockResolvedValue(placementTest({ recommendedLevel: 'A1' }));
    students.findById.mockResolvedValue(student({ cefrLevel: 'B1' }));

    await expect(
      service.confirm({ placementTestId: testId, actorUserId }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tests.confirmAndApplyLevel).not.toHaveBeenCalled();
  });

  it('rejects a second confirm on the same test', async () => {
    tests.findById.mockResolvedValue(
      placementTest({ confirmedAt: new Date('2026-03-02') }),
    );

    await expect(
      service.confirm({ placementTestId: testId, actorUserId }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
