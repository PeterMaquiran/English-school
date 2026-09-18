import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class RecordPlacementTestDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  @IsDate()
  takenAt: Date;

  @ApiPropertyOptional({ nullable: true, example: 70 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  listening?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  reading?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  writing?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  speaking?: number | null;

  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(0)
  overall: number;

  @ApiPropertyOptional({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  @IsOptional()
  @IsIn(CEFR_LEVELS)
  recommendedLevel?: CefrLevel;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
