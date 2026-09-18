import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Teacher } from '@english-school/shared';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { decimalToNumber } from '../../shared/prisma/decimal.js';

@Injectable()
export class TeachersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Teacher[]> {
    const rows = await this.prisma.teacher.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toTeacher);
  }

  async findById(id: string): Promise<Teacher | null> {
    const row = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });
    return row ? toTeacher(row) : null;
  }

  async hire(input: {
    name: string;
    email: string;
    passwordHash: string;
    specializations: string[];
    hourlyRate: number;
    isNative: boolean;
    zoomPersonalLink: string | null;
  }): Promise<Teacher> {
    const row = await this.prisma.teacher.create({
      data: {
        specializations: input.specializations,
        hourlyRate: input.hourlyRate,
        isNative: input.isNative,
        zoomPersonalLink: input.zoomPersonalLink,
        user: {
          create: {
            name: input.name,
            email: input.email,
            passwordHash: input.passwordHash,
            role: 'teacher',
          },
        },
      },
      include: { user: true },
    });
    return toTeacher(row);
  }
}

function toTeacher(row: {
  id: string;
  userId: string;
  specializations: string[];
  hourlyRate: Prisma.Decimal;
  isNative: boolean;
  zoomPersonalLink: string | null;
  createdAt: Date;
  user: { name: string; email: string };
}): Teacher {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    specializations: row.specializations,
    hourlyRate: decimalToNumber(row.hourlyRate),
    isNative: row.isNative,
    zoomPersonalLink: row.zoomPersonalLink,
    createdAt: row.createdAt,
  };
}
