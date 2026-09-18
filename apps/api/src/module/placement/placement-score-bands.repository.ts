import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PlacementScoreBand } from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';

@Injectable()
export class PlacementScoreBandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PlacementScoreBand[]> {
    const rows = await this.prisma.placementScoreBand.findMany({
      orderBy: { minScore: 'asc' },
    });
    return rows.map(toBand);
  }

  async replaceAll(bands: PlacementScoreBand[]): Promise<PlacementScoreBand[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.placementScoreBand.deleteMany();
      await tx.placementScoreBand.createMany({
        data: bands.map((band) => ({
          id: band.id ?? randomUUID(),
          minScore: band.minScore,
          maxScore: band.maxScore,
          cefrLevel: band.cefrLevel,
        })),
      });
    });
    return this.list();
  }
}

function toBand(row: {
  id: string;
  minScore: Prisma.Decimal;
  maxScore: Prisma.Decimal;
  cefrLevel: PlacementScoreBand['cefrLevel'];
}): PlacementScoreBand {
  return {
    id: row.id,
    minScore: decimalToNumber(row.minScore),
    maxScore: decimalToNumber(row.maxScore),
    cefrLevel: row.cefrLevel,
  };
}
