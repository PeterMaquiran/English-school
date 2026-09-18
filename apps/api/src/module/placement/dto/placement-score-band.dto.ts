import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class PlacementScoreBandDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  minScore: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  maxScore: number;

  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  @IsIn(CEFR_LEVELS)
  cefrLevel: CefrLevel;
}
