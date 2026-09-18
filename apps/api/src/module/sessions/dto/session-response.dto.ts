import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  type AttendanceStatus,
  type LessonSessionStatus,
} from '@english-school/shared';

export class LessonSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  batchId: string | null;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiProperty()
  teacherName: string;

  @ApiPropertyOptional({ nullable: true })
  courseName: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduleLabel: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startsAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endsAt: Date;

  @ApiPropertyOptional({ nullable: true })
  roomNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  meetingUrl: string | null;

  @ApiProperty({
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
  })
  status: LessonSessionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class AttendanceRecordDto {
  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiPropertyOptional({
    enum: ['present', 'absent', 'excused'],
    nullable: true,
  })
  status: AttendanceStatus | null;
}

export class LessonSessionDetailResponseDto extends LessonSessionResponseDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  roster: AttendanceRecordDto[];

  @ApiProperty()
  attendanceLocked: boolean;
}
