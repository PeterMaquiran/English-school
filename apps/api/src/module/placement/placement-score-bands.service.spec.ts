import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PlacementScoreBandsService } from './placement-score-bands.service.js';

const bands = {
  list: vi.fn(),
  replaceAll: vi.fn(),
};

describe('PlacementScoreBandsService', () => {
  let service: PlacementScoreBandsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PlacementScoreBandsService(bands as never);
  });

  it('rejects overlapping bands', async () => {
    await expect(
      service.replace([
        { minScore: 0, maxScore: 50, cefrLevel: 'A1' },
        { minScore: 40, maxScore: 100, cefrLevel: 'A2' },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(bands.replaceAll).not.toHaveBeenCalled();
  });

  it('maps a score using inclusive min and exclusive max except the last band', async () => {
    bands.list.mockResolvedValue([
      { minScore: 0, maxScore: 20, cefrLevel: 'A1' },
      { minScore: 20, maxScore: 40, cefrLevel: 'A2' },
      { minScore: 40, maxScore: 100, cefrLevel: 'B1' },
    ]);

    await expect(service.recommendLevel(20)).resolves.toBe('A2');
    await expect(service.recommendLevel(100)).resolves.toBe('B1');
    await expect(service.recommendLevel(19.9)).resolves.toBe('A1');
  });
});
