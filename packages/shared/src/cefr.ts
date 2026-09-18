import { CEFR_LEVELS, type CefrLevel } from './enums.js';

export function cefrRank(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

export function isCefrHigher(
  candidate: CefrLevel,
  baseline: CefrLevel,
): boolean {
  return cefrRank(candidate) > cefrRank(baseline);
}

export function isCefrLower(
  candidate: CefrLevel,
  baseline: CefrLevel,
): boolean {
  return cefrRank(candidate) < cefrRank(baseline);
}

/** target_level must be ≥ current level when both are set */
export function isValidTargetLevel(
  current: CefrLevel | null | undefined,
  target: CefrLevel | null | undefined,
): boolean {
  if (!current || !target) {
    return true;
  }
  return cefrRank(target) >= cefrRank(current);
}

export type GroupCourseLevelFit = 'match' | 'one_above' | 'blocked';

/** Group seat: current level, or one level above with a written override. */
export function groupCourseLevelFit(
  studentLevel: CefrLevel,
  courseLevel: CefrLevel,
): GroupCourseLevelFit {
  const delta = cefrRank(courseLevel) - cefrRank(studentLevel);
  if (delta === 0) {
    return 'match';
  }
  if (delta === 1) {
    return 'one_above';
  }
  return 'blocked';
}

export type ScoreBand = {
  minScore: number;
  maxScore: number;
  cefrLevel: CefrLevel;
};

/**
 * Maps an overall placement score onto Admin-configured bands.
 * min is inclusive; max is exclusive except for the last band (inclusive).
 */
export function recommendCefrFromScore(
  overall: number,
  bands: readonly ScoreBand[],
): CefrLevel | null {
  if (bands.length === 0) {
    return null;
  }

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  for (let i = 0; i < sorted.length; i += 1) {
    const band = sorted[i];
    if (!band) {
      continue;
    }
    const isLast = i === sorted.length - 1;
    const inRange = isLast
      ? overall >= band.minScore && overall <= band.maxScore
      : overall >= band.minScore && overall < band.maxScore;
    if (inRange) {
      return band.cefrLevel;
    }
  }

  return null;
}

export function scoreBandsOverlap(bands: readonly ScoreBand[]): boolean {
  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (!prev || !curr) {
      continue;
    }
    if (curr.minScore < prev.maxScore) {
      return true;
    }
  }
  return false;
}
