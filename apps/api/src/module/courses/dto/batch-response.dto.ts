import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type CourseType,
} from '@english-school/shared';

export class BatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  courseId: string;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiProperty()
  teacherName: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  cefrLevel: CefrLevel;

  @ApiProperty({ enum: ['group', 'private'] })
  courseType: CourseType;

  @ApiProperty()
  scheduleLabel: string;

  @ApiProperty({ type: [Number] })
  weekdays: number[];

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiPropertyOptional({ nullable: true })
  roomNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  meetingUrl: string | null;

  @ApiProperty({ type: String, format: 'date' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  endDate: Date;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  seatsTaken: number;

  @ApiProperty()
  tuitionAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
