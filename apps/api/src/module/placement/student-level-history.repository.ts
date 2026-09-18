import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  LevelChangeSource,
  CefrLevel,
  StudentLevelHistory,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

@Injectable()
export class StudentLevelHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    row: {
      studentId: string;
      fromLevel: CefrLevel | null;
      toLevel: CefrLevel;
      source: LevelChangeSource;
      actorUserId: string;
    },
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<StudentLevelHistory> {
    const created = await tx.studentLevelHistory.create({ data: row });
    return created;
  }

  async listByStudentId(studentId: string): Promise<StudentLevelHistory[]> {
    return this.prisma.studentLevelHistory.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
