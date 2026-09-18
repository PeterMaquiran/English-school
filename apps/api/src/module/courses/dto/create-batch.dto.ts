import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

function toTimeOfDay(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.slice(0, 5);
}

function toUtcDate(value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return value;
}

function toMeetingUrl(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export class CreateBatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ type: [Number], example: [2, 4] })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((item) => Number(item)) : value,
  )
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays: number[];

  @ApiProperty({ example: '18:00' })
  @Transform(({ value }) => toTimeOfDay(value))
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: '19:30' })
  @Transform(({ value }) => toTimeOfDay(value))
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  roomNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => toMeetingUrl(value))
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl()
  meetingUrl?: string | null;

  @ApiProperty({ type: String, format: 'date' })
  @Transform(({ value }) => toUtcDate(value))
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  @Transform(({ value }) => toUtcDate(value))
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
