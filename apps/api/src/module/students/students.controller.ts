import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import type { JwtUser } from '../../types/express.js';
import { AdminAdjustCefrDto } from './dto/admin-adjust-cefr.dto.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentResponseDto } from './dto/student-response.dto.js';
import { UpdateStudentTargetLevelDto } from './dto/update-student-target-level.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('students')
@ApiAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Post()
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Create a student profile for an existing user' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  create(@Body() body: CreateStudentDto) {
    return this.students.create(body);
  }

  @Get(':id')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Get a student profile' })
  @ApiOkResponse({ type: StudentResponseDto })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.students.getById(id);
  }

  @Patch(':id/target-level')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Update a student target CEFR level' })
  @ApiOkResponse({ type: StudentResponseDto })
  updateTargetLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateStudentTargetLevelDto,
  ) {
    return this.students.updateTargetLevel({
      studentId: id,
      targetLevel: body.targetLevel,
    });
  }

  @Post(':id/cefr')
  @Roles('admin')
  @ApiOperation({
    summary: 'Admin CEFR adjustment (including downgrade with reason)',
  })
  @ApiOkResponse({ type: StudentResponseDto })
  adjustCefr(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtUser,
    @Body() body: AdminAdjustCefrDto,
  ) {
    return this.students.adminAdjustCefr({
      studentId: id,
      actorUserId: actor.id,
      toLevel: body.toLevel,
      reason: body.reason,
    });
  }
}
