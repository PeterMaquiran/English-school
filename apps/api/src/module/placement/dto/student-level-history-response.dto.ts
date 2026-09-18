import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type LevelChangeSource,
} from '@english-school/shared';

export class StudentLevelHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiPropertyOptional({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  fromLevel: CefrLevel | null;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  toLevel: CefrLevel;

  @ApiProperty({ enum: ['placement', 'evaluation', 'admin'] })
  source: LevelChangeSource;

  @ApiProperty({ format: 'uuid' })
  actorUserId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
