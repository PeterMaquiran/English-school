import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type CourseType,
} from '@english-school/shared';

export class CreateCourseDto {
  @ApiProperty({ example: 'B1 Evening Group' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ enum: ['group', 'private'], default: 'group' })
  @IsOptional()
  @IsIn(['group', 'private'])
  courseType?: CourseType;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  @IsIn(CEFR_LEVELS)
  cefrLevel: CefrLevel;

  @ApiPropertyOptional({ example: 'General' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  defaultCapacity: number;

  @ApiProperty({ example: 480 })
  @IsNumber()
  @Min(0)
  tuitionAmount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
