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
import { EnrollmentResponseDto } from './dto/enrollment-response.dto.js';
import { SeatStudentDto } from './dto/seat-student.dto.js';
import { EnrollmentsService } from './enrollments.service.js';

@ApiTags('enrollments')
@ApiAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('batches/:batchId/enrollments')
  @Roles('admin', 'front_desk')
  @ApiOperation({ summary: 'Seat a student in a group class and open tuition' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  seat(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() body: SeatStudentDto,
  ) {
    return this.enrollments.seat(batchId, body);
  }

  @Get('batches/:batchId/enrollments')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List seats in a class' })
  @ApiOkResponse({ type: [EnrollmentResponseDto] })
  listForBatch(@Param('batchId', ParseUUIDPipe) batchId: string) {
    return this.enrollments.listForBatch(batchId);
  }

  @Get('students/:studentId/enrollments')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List a student’s group seats' })
  @ApiOkResponse({ type: [EnrollmentResponseDto] })
  listForStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.enrollments.listForStudent(studentId);
  }

  @Post('invoices/:invoiceId/collect')
  @Roles('admin', 'front_desk')
  @ApiOperation({
    summary: 'Record full tuition payment and activate the seat',
  })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  collect(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.enrollments.collect(invoiceId);
  }
}
