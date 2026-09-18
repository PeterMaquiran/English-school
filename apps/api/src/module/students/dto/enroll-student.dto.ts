import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CEFR_LEVELS, type CefrLevel } from '@english-school/shared';

export class EnrollStudentDto {
  @ApiProperty({ example: 'Ada Lopez' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'ada@family.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'Welcome123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

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
