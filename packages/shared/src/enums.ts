import { z } from 'zod';

export const roleSchema = z.enum([
  'admin',
  'front_desk',
  'teacher',
  'student',
  'parent',
]);
export type Role = z.infer<typeof roleSchema>;

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const cefrLevelSchema = z.enum(CEFR_LEVELS);
export type CefrLevel = z.infer<typeof cefrLevelSchema>;

export const levelChangeSourceSchema = z.enum([
  'placement',
  'evaluation',
  'admin',
]);
export type LevelChangeSource = z.infer<typeof levelChangeSourceSchema>;

export const courseTypeSchema = z.enum(['group', 'private']);
export type CourseType = z.infer<typeof courseTypeSchema>;

export const enrollmentStatusSchema = z.enum([
  'pending_payment',
  'active',
  'completed',
  'dropped',
]);
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

export const paymentStatusSchema = z.enum([
  'draft',
  'open',
  'paid',
  'void',
  'overdue',
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const SEAT_HOLDING_STATUSES = [
  'pending_payment',
  'active',
] as const satisfies readonly EnrollmentStatus[];

export const PAY_LATER_DAYS = 7;
