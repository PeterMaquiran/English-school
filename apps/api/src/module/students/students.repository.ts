import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  CefrLevel,
  CreateStudentInput,
  Student,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';

const studentWithUser = {
  user: { select: { name: true, email: true } },
} as const;

type StudentRow = {
  id: string;
  userId: string;
  cefrLevel: CefrLevel | null;
  targetLevel: CefrLevel | null;
  lessonCreditsRemaining: Prisma.Decimal;
  createdAt: Date;
  user: { name: string; email: string };
};

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Student[]> {
    const rows = await this.prisma.student.findMany({
      include: studentWithUser,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toStudent);
  }

  async findById(id: string): Promise<Student | null> {
    const row = await this.prisma.student.findUnique({
      where: { id },
      include: studentWithUser,
    });
    return row ? toStudent(row) : null;
  }

  async findByUserId(userId: string): Promise<Student | null> {
    const row = await this.prisma.student.findUnique({
      where: { userId },
      include: studentWithUser,
    });
    return row ? toStudent(row) : null;
  }

  async create(input: CreateStudentInput): Promise<Student> {
    const row = await this.prisma.student.create({
      data: {
        userId: input.userId,
        cefrLevel: input.cefrLevel ?? null,
        targetLevel: input.targetLevel ?? null,
      },
      include: studentWithUser,
    });
    return toStudent(row);
  }

  async enroll(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    targetLevel?: CefrLevel | null;
  }): Promise<Student> {
    const row = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: 'student',
          phone: input.phone ?? null,
        },
      });
      return tx.student.create({
        data: {
          userId: user.id,
          targetLevel: input.targetLevel ?? null,
        },
        include: studentWithUser,
      });
    });
    return toStudent(row);
  }

  async updateLevels(
    studentId: string,
    levels: { cefrLevel?: CefrLevel | null; targetLevel?: CefrLevel | null },
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<Student> {
    const row = await tx.student.update({
      where: { id: studentId },
      data: {
        ...(levels.cefrLevel !== undefined
          ? { cefrLevel: levels.cefrLevel }
          : {}),
        ...(levels.targetLevel !== undefined
          ? { targetLevel: levels.targetLevel }
          : {}),
      },
      include: studentWithUser,
    });
    return toStudent(row);
  }
}

function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    cefrLevel: row.cefrLevel,
    targetLevel: row.targetLevel,
    lessonCreditsRemaining: decimalToNumber(row.lessonCreditsRemaining),
    createdAt: row.createdAt,
  };
}
