import { z } from 'zod';
import {
  cefrLevelSchema,
  courseTypeSchema,
  enrollmentStatusSchema,
  paymentStatusSchema,
} from './enums.js';

const uuid = z.string().uuid();

export const teacherSchema = z.object({
  id: uuid,
  userId: uuid,
  name: z.string(),
  email: z.string().email(),
  specializations: z.array(z.string().trim().min(1)).min(1),
  hourlyRate: z.number().nonnegative(),
  isNative: z.boolean(),
  zoomPersonalLink: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type Teacher = z.infer<typeof teacherSchema>;

export const hireTeacherInputSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  specializations: z.array(z.string().trim().min(1)).min(1).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  isNative: z.boolean().optional(),
  zoomPersonalLink: z.string().trim().min(1).nullable().optional(),
});
export type HireTeacherInput = z.infer<typeof hireTeacherInputSchema>;

export const courseSchema = z.object({
  id: uuid,
  name: z.string(),
  courseType: courseTypeSchema,
  cefrLevel: cefrLevelSchema,
  specialization: z.string(),
  defaultCapacity: z.number().int().positive(),
  tuitionAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type Course = z.infer<typeof courseSchema>;

export const createCourseInputSchema = z.object({
  name: z.string().trim().min(1),
  courseType: courseTypeSchema.default('group'),
  cefrLevel: cefrLevelSchema,
  specialization: z.string().trim().min(1).optional(),
  defaultCapacity: z.number().int().positive(),
  tuitionAmount: z.number().nonnegative(),
  currency: z.string().trim().min(1).optional(),
});
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

export const batchSchema = z.object({
  id: uuid,
  courseId: uuid,
  teacherId: uuid,
  teacherName: z.string(),
  courseName: z.string(),
  cefrLevel: cefrLevelSchema,
  courseType: courseTypeSchema,
  scheduleLabel: z.string(),
  roomNumber: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().int().positive(),
  seatsTaken: z.number().int().nonnegative(),
  tuitionAmount: z.number().nonnegative(),
  currency: z.string(),
  createdAt: z.coerce.date(),
});
export type Batch = z.infer<typeof batchSchema>;

export const createBatchInputSchema = z
  .object({
    teacherId: uuid,
    scheduleLabel: z.string().trim().min(1),
    roomNumber: z.preprocess(
      (value) => (value === '' ? null : value),
      z.string().trim().min(1).nullable().optional(),
    ),
    meetingUrl: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().trim().url().nullable().optional(),
    ),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.number().int().positive().optional(),
  })
  .refine((input) => input.endDate >= input.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });
export type CreateBatchInput = z.infer<typeof createBatchInputSchema>;

export const invoiceSchema = z.object({
  id: uuid,
  studentId: uuid,
  enrollmentId: uuid.nullable(),
  amount: z.number().nonnegative(),
  currency: z.string(),
  creditHoursBought: z.number().nonnegative(),
  paymentStatus: paymentStatusSchema,
  dueDate: z.coerce.date(),
  description: z.string(),
  createdAt: z.coerce.date(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const enrollmentSchema = z.object({
  id: uuid,
  studentId: uuid,
  studentName: z.string(),
  batchId: uuid,
  status: enrollmentStatusSchema,
  levelOverrideReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  invoice: invoiceSchema.nullable(),
  batch: batchSchema.optional(),
});
export type Enrollment = z.infer<typeof enrollmentSchema>;

export const seatStudentInputSchema = z.object({
  studentId: uuid,
  payLater: z.boolean().optional(),
  overrideReason: z.string().trim().min(1).optional(),
});
export type SeatStudentInput = z.infer<typeof seatStudentInputSchema>;
