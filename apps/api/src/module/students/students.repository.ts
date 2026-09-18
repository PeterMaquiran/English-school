import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  CefrLevel,
  CreateStudentInput,
  Student,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';

@Injectable()
export class StudentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Student | null> {
    const row = await this.prisma.student.findUnique({ where: { id } });
    return row ? toStudent(row) : null;
  }

  async findByUserId(userId: string): Promise<Student | null> {
    const row = await this.prisma.student.findUnique({ where: { userId } });
    return row ? toStudent(row) : null;
  }

  async create(input: CreateStudentInput): Promise<Student> {
    const row = await this.prisma.student.create({
      data: {
        userId: input.userId,
        cefrLevel: input.cefrLevel ?? null,
        targetLevel: input.targetLevel ?? null,
      },
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
    });
    return toStudent(row);
  }
}

function toStudent(row: {
  id: string;
  userId: string;
  cefrLevel: CefrLevel | null;
  targetLevel: CefrLevel | null;
  lessonCreditsRemaining: Prisma.Decimal;
  createdAt: Date;
}): Student {
  return {
    id: row.id,
    userId: row.userId,
    cefrLevel: row.cefrLevel,
    targetLevel: row.targetLevel,
    lessonCreditsRemaining: decimalToNumber(row.lessonCreditsRemaining),
    createdAt: row.createdAt,
  };
}
