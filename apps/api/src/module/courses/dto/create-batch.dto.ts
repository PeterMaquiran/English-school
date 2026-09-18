import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: 'Tue & Thu 18:00' })
  @IsString()
  @MinLength(1)
  scheduleLabel: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  roomNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl()
  meetingUrl?: string | null;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
