import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class CreateStudentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(CEFR_LEVELS)
  cefrLevel?: CefrLevel | null;

  @ApiPropertyOptional({
    enum: CEFR_LEVELS,
    enumName: 'CefrLevel',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(CEFR_LEVELS)
  targetLevel?: CefrLevel | null;
}
