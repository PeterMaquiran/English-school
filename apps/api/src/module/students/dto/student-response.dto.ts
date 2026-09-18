import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class StudentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  cefrLevel: CefrLevel | null;

  @ApiPropertyOptional({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  targetLevel: CefrLevel | null;

  @ApiProperty({ example: 0 })
  lessonCreditsRemaining: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
