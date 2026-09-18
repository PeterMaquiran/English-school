import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  CefrLevel,
  PlacementTest,
  RecordPlacementTestInput,
} from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  decimalToNumber,
  optionalDecimalToNumber,
} from '../../shared/prisma/decimal.js';

@Injectable()
export class PlacementTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PlacementTest | null> {
    const row = await this.prisma.placementTest.findUnique({ where: { id } });
    return row ? toPlacementTest(row) : null;
  }

  async listByStudentId(studentId: string): Promise<PlacementTest[]> {
    const rows = await this.prisma.placementTest.findMany({
      where: { studentId },
      orderBy: { takenAt: 'desc' },
    });
    return rows.map(toPlacementTest);
  }

  async create(
    input: RecordPlacementTestInput & { recommendedLevel: CefrLevel },
  ): Promise<PlacementTest> {
    const row = await this.prisma.placementTest.create({
      data: {
        studentId: input.studentId,
        takenAt: input.takenAt,
        listening: input.listening ?? null,
        reading: input.reading ?? null,
        writing: input.writing ?? null,
        speaking: input.speaking ?? null,
        overall: input.overall,
        recommendedLevel: input.recommendedLevel,
        notes: input.notes ?? null,
      },
    });
    return toPlacementTest(row);
  }

  async confirmAndApplyLevel(params: {
    testId: string;
    actorUserId: string;
    confirmedAt: Date;
    studentId: string;
    fromLevel: CefrLevel | null;
    toLevel: CefrLevel;
    writeHistory: boolean;
  }): Promise<PlacementTest> {
    const row = await this.prisma.$transaction(async (tx) => {
      const test = await tx.placementTest.update({
        where: { id: params.testId },
        data: {
          confirmedAt: params.confirmedAt,
          confirmedByUserId: params.actorUserId,
        },
      });

      if (params.writeHistory) {
        await tx.student.update({
          where: { id: params.studentId },
          data: { cefrLevel: params.toLevel },
        });
        await tx.studentLevelHistory.create({
          data: {
            studentId: params.studentId,
            fromLevel: params.fromLevel,
            toLevel: params.toLevel,
            source: 'placement',
            actorUserId: params.actorUserId,
          },
        });
      }

      return test;
    });

    return toPlacementTest(row);
  }
}

function toPlacementTest(row: {
  id: string;
  studentId: string;
  takenAt: Date;
  listening: Prisma.Decimal | null;
  reading: Prisma.Decimal | null;
  writing: Prisma.Decimal | null;
  speaking: Prisma.Decimal | null;
  overall: Prisma.Decimal;
  recommendedLevel: CefrLevel;
  confirmedAt: Date | null;
  confirmedByUserId: string | null;
  notes: string | null;
}): PlacementTest {
  return {
    id: row.id,
    studentId: row.studentId,
    takenAt: row.takenAt,
    listening: optionalDecimalToNumber(row.listening),
    reading: optionalDecimalToNumber(row.reading),
    writing: optionalDecimalToNumber(row.writing),
    speaking: optionalDecimalToNumber(row.speaking),
    overall: decimalToNumber(row.overall),
    recommendedLevel: row.recommendedLevel,
    confirmedAt: row.confirmedAt,
    confirmedByUserId: row.confirmedByUserId,
    notes: row.notes,
  };
}
