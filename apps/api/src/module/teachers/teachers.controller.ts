import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAuth } from '../../shared/decorators/api-auth.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import { HireTeacherDto } from './dto/hire-teacher.dto.js';
import { TeacherResponseDto } from './dto/teacher-response.dto.js';
import { TeachersService } from './teachers.service.js';

@ApiTags('teachers')
@ApiAuth()
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachers: TeachersService) {}

  @Post()
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Hire a teacher (creates login + profile)' })
  @ApiCreatedResponse({ type: TeacherResponseDto })
  hire(@Body() body: HireTeacherDto) {
    return this.teachers.hire(body);
  }

  @Get()
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List teachers' })
  @ApiOkResponse({ type: [TeacherResponseDto] })
  list() {
    return this.teachers.list();
  }
}
