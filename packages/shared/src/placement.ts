import { z } from 'zod';
import { cefrLevelSchema, levelChangeSourceSchema } from './enums.js';

const uuid = z.string().uuid();
const score = z.number().min(0);

export const placementScoreBandSchema = z
  .object({
    id: uuid.optional(),
    minScore: score,
    maxScore: score,
    cefrLevel: cefrLevelSchema,
  })
  .refine((band) => band.maxScore > band.minScore, {
    message: 'maxScore must be greater than minScore',
    path: ['maxScore'],
  });
export type PlacementScoreBand = z.infer<typeof placementScoreBandSchema>;

export const replacePlacementScoreBandsInputSchema = z
  .array(placementScoreBandSchema)
  .min(1);
export type ReplacePlacementScoreBandsInput = z.infer<
  typeof replacePlacementScoreBandsInputSchema
>;

export const placementTestSchema = z.object({
  id: uuid,
  studentId: uuid,
  takenAt: z.coerce.date(),
  listening: score.nullable(),
  reading: score.nullable(),
  writing: score.nullable(),
  speaking: score.nullable(),
  overall: score,
  recommendedLevel: cefrLevelSchema,
  confirmedAt: z.coerce.date().nullable(),
  confirmedByUserId: uuid.nullable(),
  notes: z.string().nullable(),
});
export type PlacementTest = z.infer<typeof placementTestSchema>;

export const recordPlacementTestInputSchema = z.object({
  studentId: uuid,
  takenAt: z.coerce.date(),
  listening: score.nullable().optional(),
  reading: score.nullable().optional(),
  writing: score.nullable().optional(),
  speaking: score.nullable().optional(),
  overall: score,
  recommendedLevel: cefrLevelSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type RecordPlacementTestInput = z.infer<
  typeof recordPlacementTestInputSchema
>;
export const recordPlacementTestBodySchema =
  recordPlacementTestInputSchema.omit({ studentId: true });
export type RecordPlacementTestBody = z.infer<
  typeof recordPlacementTestBodySchema
>;

export const confirmPlacementTestInputSchema = z.object({
  placementTestId: uuid,
  actorUserId: uuid,
});
export type ConfirmPlacementTestInput = z.infer<
  typeof confirmPlacementTestInputSchema
>;

export const studentLevelHistorySchema = z.object({
  id: uuid,
  studentId: uuid,
  fromLevel: cefrLevelSchema.nullable(),
  toLevel: cefrLevelSchema,
  source: levelChangeSourceSchema,
  actorUserId: uuid,
  createdAt: z.coerce.date(),
});
export type StudentLevelHistory = z.infer<typeof studentLevelHistorySchema>;
