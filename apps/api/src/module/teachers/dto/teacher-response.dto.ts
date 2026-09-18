import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeacherResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [String] })
  specializations: string[];

  @ApiProperty()
  hourlyRate: number;

  @ApiProperty()
  isNative: boolean;

  @ApiPropertyOptional({ nullable: true })
  zoomPersonalLink: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
