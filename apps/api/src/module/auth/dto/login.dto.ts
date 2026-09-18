import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@school.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 1, example: 'ChangeMe123!' })
  @IsString()
  @MinLength(1)
  password: string;
}
