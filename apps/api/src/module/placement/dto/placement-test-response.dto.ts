import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class PlacementTestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  takenAt: Date;

  @ApiPropertyOptional({ nullable: true })
  listening: number | null;

  @ApiPropertyOptional({ nullable: true })
  reading: number | null;

  @ApiPropertyOptional({ nullable: true })
  writing: number | null;

  @ApiPropertyOptional({ nullable: true })
  speaking: number | null;

  @ApiProperty()
  overall: number;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  recommendedLevel: CefrLevel;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  confirmedAt: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  confirmedByUserId: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;
}
