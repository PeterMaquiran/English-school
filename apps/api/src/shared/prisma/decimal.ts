import { Prisma } from '@prisma/client';

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function optionalDecimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }
  return decimalToNumber(value);
}
