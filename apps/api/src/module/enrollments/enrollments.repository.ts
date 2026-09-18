import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  type Enrollment,
  type EnrollmentStatus,
  type Invoice,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';
import { CoursesRepository } from '../courses/courses.repository.js';

const holdingStatuses: EnrollmentStatus[] = ['pending_payment', 'active'];

const enrollmentInclude = {
  student: { include: { user: true } },
  invoice: true,
} as const;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

@Injectable()
export class EnrollmentsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesRepository,
  ) {}

  async listForBatch(batchId: string): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { batchId },
      include: enrollmentInclude,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => toEnrollment(row));
  }

  async listForStudent(studentId: string): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: enrollmentInclude,
      orderBy: { createdAt: 'desc' },
    });
    const withBatches = await Promise.all(
      rows.map(async (row) => {
        const mapped = toEnrollment(row);
        const batch = await this.courses.findBatchById(row.batchId);
        return { ...mapped, batch: batch ?? undefined };
      }),
    );
    return withBatches;
  }

  async findById(id: string): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: { id },
      include: enrollmentInclude,
    });
    return row ? toEnrollment(row) : null;
  }

  findOpenSeat(studentId: string, batchId: string) {
    return this.prisma.enrollment.findFirst({
      where: {
        studentId,
        batchId,
        status: { in: holdingStatuses },
      },
    });
  }

  countSeats(batchId: string) {
    return this.prisma.enrollment.count({
      where: {
        batchId,
        status: { in: holdingStatuses },
      },
    });
  }

  async listHoldingRoster(
    batchId: string,
  ): Promise<{ studentId: string; studentName: string }[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { batchId, status: { in: holdingStatuses } },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.student.user.name,
    }));
  }

  async createSeat(input: {
    studentId: string;
    batchId: string;
    status: EnrollmentStatus;
    levelOverrideReason: string | null;
    amount: number;
    currency: string;
    dueDate: Date;
    description: string;
  }): Promise<Enrollment> {
    const row = await this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: input.studentId,
          batchId: input.batchId,
          status: input.status,
          levelOverrideReason: input.levelOverrideReason,
        },
      });
      await tx.invoice.create({
        data: {
          studentId: input.studentId,
          enrollmentId: enrollment.id,
          amount: input.amount,
          currency: input.currency,
          creditHoursBought: 0,
          paymentStatus: 'open',
          dueDate: input.dueDate,
          description: input.description,
        },
      });
      return tx.enrollment.findUniqueOrThrow({
        where: { id: enrollment.id },
        include: enrollmentInclude,
      });
    });
    return toEnrollment(row);
  }

  async collectInvoice(invoiceId: string): Promise<Enrollment> {
    const row = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { paymentStatus: 'paid' },
      });
      if (!invoice.enrollmentId) {
        throw new Error('Invoice is not attached to a seat');
      }
      await tx.enrollment.update({
        where: { id: invoice.enrollmentId },
        data: { status: 'active' },
      });
      return tx.enrollment.findUniqueOrThrow({
        where: { id: invoice.enrollmentId },
        include: enrollmentInclude,
      });
    });
    return toEnrollment(row);
  }

  findInvoice(id: string) {
    return this.prisma.invoice.findUnique({ where: { id } });
  }
}

function toInvoice(row: {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  amount: Prisma.Decimal;
  currency: string;
  creditHoursBought: Prisma.Decimal;
  paymentStatus: Invoice['paymentStatus'];
  dueDate: Date;
  description: string;
  createdAt: Date;
}): Invoice {
  return {
    id: row.id,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    amount: decimalToNumber(row.amount),
    currency: row.currency,
    creditHoursBought: decimalToNumber(row.creditHoursBought),
    paymentStatus: row.paymentStatus,
    dueDate: row.dueDate,
    description: row.description,
    createdAt: row.createdAt,
  };
}

function toEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.student.user.name,
    batchId: row.batchId,
    status: row.status,
    levelOverrideReason: row.levelOverrideReason,
    createdAt: row.createdAt,
    invoice: row.invoice ? toInvoice(row.invoice) : null,
  };
}
