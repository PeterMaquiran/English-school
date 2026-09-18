import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class SeatStudentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  payLater?: boolean;

  @ApiPropertyOptional({
    description: 'Required when the class is one level above the student',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  overrideReason?: string;
}
