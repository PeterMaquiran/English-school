import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { BatchResponseDto } from './dto/batch-response.dto.js';
import { CourseResponseDto } from './dto/course-response.dto.js';
import { CreateBatchDto } from './dto/create-batch.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesService } from './courses.service.js';

@ApiTags('courses')
@ApiAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post('courses')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Create a course' })
  @ApiCreatedResponse({ type: CourseResponseDto })
  createCourse(@Body() body: CreateCourseDto) {
    return this.courses.createCourse({
      ...body,
      courseType: body.courseType ?? 'group',
    });
  }

  @Get('courses')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List courses' })
  @ApiOkResponse({ type: [CourseResponseDto] })
  listCourses() {
    return this.courses.listCourses();
  }

  @Get('courses/:id')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Get a course' })
  @ApiOkResponse({ type: CourseResponseDto })
  getCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.courses.getCourse(id);
  }

  @Post('courses/:id/batches')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Open a class (batch) for a course' })
  @ApiCreatedResponse({ type: BatchResponseDto })
  createBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateBatchDto,
  ) {
    return this.courses.createBatch(id, body);
  }

  @Get('courses/:id/batches')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List classes for a course' })
  @ApiOkResponse({ type: [BatchResponseDto] })
  listCourseBatches(@Param('id', ParseUUIDPipe) id: string) {
    return this.courses.listBatches(id);
  }

  @Get('batches')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List all classes' })
  @ApiOkResponse({ type: [BatchResponseDto] })
  listBatches() {
    return this.courses.listBatches();
  }

  @Get('batches/:id')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Get a class' })
  @ApiOkResponse({ type: BatchResponseDto })
  getBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.courses.getBatch(id);
  }
}
