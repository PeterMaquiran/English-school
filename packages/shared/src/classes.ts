import { z } from 'zod';
import {
  attendanceStatusSchema,
  cefrLevelSchema,
  courseTypeSchema,
  enrollmentStatusSchema,
  lessonSessionStatusSchema,
  paymentStatusSchema,
  timeOfDaySchema,
  weekdaySchema,
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
  weekdays: z.array(weekdaySchema),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
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
    weekdays: z.array(weekdaySchema).min(1),
    startTime: z.preprocess(
      (value) => (typeof value === 'string' ? value.slice(0, 5) : value),
      timeOfDaySchema,
    ),
    endTime: z.preprocess(
      (value) => (typeof value === 'string' ? value.slice(0, 5) : value),
      timeOfDaySchema,
    ),
    roomNumber: z.preprocess(
      (value) => (value === '' ? null : value),
      z.string().trim().min(1).nullable().optional(),
    ),
    meetingUrl: z.preprocess((value) => {
      if (value === '' || value === undefined) {
        return undefined;
      }
      if (typeof value !== 'string') {
        return value;
      }
      const trimmed = value.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      return `https://${trimmed}`;
    }, z.string().trim().url().nullable().optional()),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.number().int().positive().optional(),
  })
  .refine((input) => input.endDate >= input.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine(
    (input) => {
      const start = input.startTime.split(':').map(Number);
      const end = input.endTime.split(':').map(Number);
      return (
        (end[0] ?? 0) * 60 + (end[1] ?? 0) >
        (start[0] ?? 0) * 60 + (start[1] ?? 0)
      );
    },
    {
      message: 'Class must end after it starts',
      path: ['endTime'],
    },
  );
export type CreateBatchInput = z.infer<typeof createBatchInputSchema>;

export const lessonSessionSchema = z.object({
  id: uuid,
  batchId: uuid.nullable(),
  teacherId: uuid,
  teacherName: z.string(),
  courseName: z.string().nullable(),
  scheduleLabel: z.string().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  roomNumber: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  status: lessonSessionStatusSchema,
  createdAt: z.coerce.date(),
});
export type LessonSession = z.infer<typeof lessonSessionSchema>;

export const attendanceRecordSchema = z.object({
  studentId: uuid,
  studentName: z.string(),
  status: attendanceStatusSchema.nullable(),
});
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const lessonSessionDetailSchema = lessonSessionSchema.extend({
  roster: z.array(attendanceRecordSchema),
  attendanceLocked: z.boolean(),
});
export type LessonSessionDetail = z.infer<typeof lessonSessionDetailSchema>;

export const markAttendanceInputSchema = z.object({
  studentId: uuid,
  status: attendanceStatusSchema,
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceInputSchema>;

export const updateSessionStatusInputSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']),
});
export type UpdateSessionStatusInput = z.infer<
  typeof updateSessionStatusInputSchema
>;

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
