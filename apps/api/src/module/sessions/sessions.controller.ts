import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../../shared/decorators/api-auth.decorator.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { Roles } from '../../shared/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';
import type { JwtUser } from '../../types/express.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import {
  LessonSessionDetailResponseDto,
  LessonSessionResponseDto,
} from './dto/session-response.dto.js';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('sessions')
@ApiAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get('sessions')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List lesson sessions in a date range' })
  @ApiOkResponse({ type: [LessonSessionResponseDto] })
  list(
    @CurrentUser() actor: JwtUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.sessions.list(actor, { from, to, batchId });
  }

  @Get('sessions/:id')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Get a lesson session and its attendance roster' })
  @ApiOkResponse({ type: LessonSessionDetailResponseDto })
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: JwtUser) {
    return this.sessions.getDetail(id, actor);
  }

  @Patch('sessions/:id')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Mark a session completed or cancelled' })
  @ApiOkResponse({ type: LessonSessionResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSessionStatusDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.sessions.updateStatus(id, body, actor);
  }

  @Put('sessions/:id/attendance')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'Mark one student present, absent, or excused' })
  @ApiOkResponse({ type: LessonSessionDetailResponseDto })
  markAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarkAttendanceDto,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.sessions.markAttendance(id, body, actor);
  }
}
