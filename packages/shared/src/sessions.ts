const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Unmarked roster rows become absent this long after class ends. */
export const UNMARKED_BECOMES_ABSENT_AFTER_MS = MS_PER_DAY;

/** After this, only admin can change attendance. */
export const ATTENDANCE_LOCK_AFTER_MS = 2 * MS_PER_DAY;

export const WEEKDAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export function formatScheduleLabel(
  weekdays: number[],
  startTime: string,
  endTime: string,
): string {
  const unique = [...new Set(weekdays)].sort((a, b) => {
    const order = (day: number) => (day === 0 ? 7 : day);
    return order(a) - order(b);
  });
  const days = unique
    .map((day) => WEEKDAY_LABELS[day])
    .filter((label): label is (typeof WEEKDAY_LABELS)[number] =>
      Boolean(label),
    );
  return `${days.join(' & ')} ${startTime}–${endTime}`;
}

export function parseTimeOfDay(value: string): {
  hours: number;
  minutes: number;
} {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error('Time must be HH:mm');
  }
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function utcDateOnly(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function holidayKey(value: Date): string {
  return utcDateOnly(value).toISOString().slice(0, 10);
}

export function listGroupSessionWindows(input: {
  startDate: Date;
  endDate: Date;
  weekdays: number[];
  startTime: string;
  endTime: string;
  holidays?: Date[];
}): { startsAt: Date; endsAt: Date }[] {
  const startTime = parseTimeOfDay(input.startTime);
  const endTime = parseTimeOfDay(input.endTime);
  const startMinutes = startTime.hours * 60 + startTime.minutes;
  const endMinutes = endTime.hours * 60 + endTime.minutes;
  if (endMinutes <= startMinutes) {
    throw new Error('Class must end after it starts on the same day');
  }

  const holidayKeys = new Set((input.holidays ?? []).map(holidayKey));
  const weekdaySet = new Set(input.weekdays);
  const start = utcDateOnly(input.startDate);
  const end = utcDateOnly(input.endDate);
  const windows: { startsAt: Date; endsAt: Date }[] = [];

  for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
    const day = new Date(time);
    if (!weekdaySet.has(day.getUTCDay())) {
      continue;
    }
    if (holidayKeys.has(holidayKey(day))) {
      continue;
    }
    windows.push({
      startsAt: new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          startTime.hours,
          startTime.minutes,
        ),
      ),
      endsAt: new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          endTime.hours,
          endTime.minutes,
        ),
      ),
    });
  }

  return windows;
}

export function attendanceIsLocked(endsAt: Date, now = new Date()): boolean {
  return now.getTime() >= endsAt.getTime() + ATTENDANCE_LOCK_AFTER_MS;
}

export function unmarkedShouldBecomeAbsent(
  endsAt: Date,
  now = new Date(),
): boolean {
  return now.getTime() >= endsAt.getTime() + UNMARKED_BECOMES_ABSENT_AFTER_MS;
}
