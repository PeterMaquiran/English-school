import { ApiProperty } from '@nestjs/swagger';
import { IsIn, ValidateIf } from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class UpdateStudentTargetLevelDto {
  @ApiProperty({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null)
  @IsIn(CEFR_LEVELS)
  targetLevel: CefrLevel | null;
}
