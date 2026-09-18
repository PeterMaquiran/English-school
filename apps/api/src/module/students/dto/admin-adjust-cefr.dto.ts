import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class AdminAdjustCefrDto {
  @ApiProperty({ enum: CEFR_LEVELS, enumName: 'CefrLevel' })
  @IsIn(CEFR_LEVELS)
  toLevel: CefrLevel;

  @ApiProperty({ example: 'Misplaced diagnostic' })
  @IsString()
  @MinLength(1)
  reason: string;
}
