import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import type { AttendanceStatus } from '@english-school/shared';

export class MarkAttendanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: ['present', 'absent', 'excused'] })
  @IsIn(['present', 'absent', 'excused'])
  status: AttendanceStatus;
}
