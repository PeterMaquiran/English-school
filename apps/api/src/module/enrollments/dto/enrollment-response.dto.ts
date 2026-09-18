import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type EnrollmentStatus,
  type PaymentStatus,
} from '@english-school/shared';
import { BatchResponseDto } from '../../courses/dto/batch-response.dto.js';

export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  enrollmentId: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  creditHoursBought: number;

  @ApiProperty({ enum: ['draft', 'open', 'paid', 'void', 'overdue'] })
  paymentStatus: PaymentStatus;

  @ApiProperty({ type: String, format: 'date' })
  dueDate: Date;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty({ format: 'uuid' })
  batchId: string;

  @ApiProperty({
    enum: ['pending_payment', 'active', 'completed', 'dropped'],
  })
  status: EnrollmentStatus;

  @ApiPropertyOptional({ nullable: true })
  levelOverrideReason: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: InvoiceResponseDto, nullable: true })
  invoice: InvoiceResponseDto | null;

  @ApiPropertyOptional({ type: BatchResponseDto })
  batch?: BatchResponseDto;

  @ApiPropertyOptional({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  cefrLevel?: CefrLevel;
}
