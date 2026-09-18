import { z } from 'zod';
import { cefrLevelSchema } from './enums.js';

const uuid = z.string().uuid();

export const studentSchema = z.object({
  id: uuid,
  userId: uuid,
  cefrLevel: cefrLevelSchema.nullable(),
  targetLevel: cefrLevelSchema.nullable(),
  lessonCreditsRemaining: z.number().nonnegative(),
  createdAt: z.coerce.date(),
});
export type Student = z.infer<typeof studentSchema>;

export const createStudentInputSchema = z.object({
  userId: uuid,
  cefrLevel: cefrLevelSchema.nullable().optional(),
  targetLevel: cefrLevelSchema.nullable().optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const updateStudentTargetLevelInputSchema = z.object({
  studentId: uuid,
  targetLevel: cefrLevelSchema.nullable(),
});
export type UpdateStudentTargetLevelInput = z.infer<
  typeof updateStudentTargetLevelInputSchema
>;
export const updateStudentTargetLevelBodySchema =
  updateStudentTargetLevelInputSchema.omit({ studentId: true });
export type UpdateStudentTargetLevelBody = z.infer<
  typeof updateStudentTargetLevelBodySchema
>;

export const adminAdjustCefrInputSchema = z.object({
  studentId: uuid,
  toLevel: cefrLevelSchema,
  actorUserId: uuid,
  reason: z.string().trim().min(1),
});
export type AdminAdjustCefrInput = z.infer<typeof adminAdjustCefrInputSchema>;
export const adminAdjustCefrBodySchema = adminAdjustCefrInputSchema.omit({
  studentId: true,
  actorUserId: true,
});
export type AdminAdjustCefrBody = z.infer<typeof adminAdjustCefrBodySchema>;

export const applyApprovedEvaluationInputSchema = z.object({
  studentId: uuid,
  toLevel: cefrLevelSchema,
  actorUserId: uuid,
});
export type ApplyApprovedEvaluationInput = z.infer<
  typeof applyApprovedEvaluationInputSchema
>;
