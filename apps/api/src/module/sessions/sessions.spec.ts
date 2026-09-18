import { describe, expect, it } from 'vitest';
import {
  formatScheduleLabel,
  listGroupSessionWindows,
  unmarkedShouldBecomeAbsent,
  attendanceIsLocked,
} from '@english-school/shared';

describe('listGroupSessionWindows', () => {
  it('creates Tuesday and Thursday classes and skips holidays', () => {
    const windows = listGroupSessionWindows({
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-09-10T00:00:00.000Z'),
      weekdays: [2, 4],
      startTime: '18:00',
      endTime: '19:30',
      holidays: [new Date('2026-09-03T00:00:00.000Z')],
    });

    expect(windows.map((row) => row.startsAt.toISOString())).toEqual([
      '2026-09-01T18:00:00.000Z',
      '2026-09-08T18:00:00.000Z',
      '2026-09-10T18:00:00.000Z',
    ]);
    expect(windows[0]?.endsAt.toISOString()).toBe('2026-09-01T19:30:00.000Z');
  });

  it('labels Mon-first weekdays', () => {
    expect(formatScheduleLabel([0, 2, 4], '18:00', '19:00')).toBe(
      'Tue & Thu & Sun 18:00–19:00',
    );
  });
});

describe('attendance windows', () => {
  const endsAt = new Date('2026-09-01T19:30:00.000Z');

  it('fills unmarked absent after 24 hours', () => {
    expect(
      unmarkedShouldBecomeAbsent(endsAt, new Date('2026-09-02T19:29:59.000Z')),
    ).toBe(false);
    expect(
      unmarkedShouldBecomeAbsent(endsAt, new Date('2026-09-02T19:30:00.000Z')),
    ).toBe(true);
  });

  it('locks edits after 48 hours', () => {
    expect(
      attendanceIsLocked(endsAt, new Date('2026-09-03T19:29:59.000Z')),
    ).toBe(false);
    expect(
      attendanceIsLocked(endsAt, new Date('2026-09-03T19:30:00.000Z')),
    ).toBe(true);
  });
});
