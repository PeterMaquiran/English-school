import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type CourseType,
} from '@english-school/shared';

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['group', 'private'] })
  courseType: CourseType;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  cefrLevel: CefrLevel;

  @ApiProperty()
  specialization: string;

  @ApiProperty()
  defaultCapacity: number;

  @ApiProperty()
  tuitionAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
