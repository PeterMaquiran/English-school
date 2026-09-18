import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
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
import { PlacementScoreBandDto } from './dto/placement-score-band.dto.js';
import { PlacementTestResponseDto } from './dto/placement-test-response.dto.js';
import { RecordPlacementTestDto } from './dto/record-placement-test.dto.js';
import { StudentLevelHistoryResponseDto } from './dto/student-level-history-response.dto.js';
import { PlacementScoreBandsService } from './placement-score-bands.service.js';
import { PlacementTestsService } from './placement-tests.service.js';

@ApiTags('placement')
@ApiAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlacementController {
  constructor(
    private readonly tests: PlacementTestsService,
    private readonly bands: PlacementScoreBandsService,
  ) {}

  @Get('placement/score-bands')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List placement score-to-CEFR bands' })
  @ApiOkResponse({ type: [PlacementScoreBandDto] })
  listBands() {
    return this.bands.list();
  }

  @Put('placement/score-bands')
  @Roles('admin')
  @ApiOperation({ summary: 'Replace all placement score bands' })
  @ApiBody({ type: [PlacementScoreBandDto] })
  @ApiOkResponse({ type: [PlacementScoreBandDto] })
  replaceBands(
    @Body(
      new ParseArrayPipe({
        items: PlacementScoreBandDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: PlacementScoreBandDto[],
  ) {
    return this.bands.replace(body);
  }

  @Get('students/:studentId/placement-tests')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List placement tests for a student' })
  @ApiOkResponse({ type: [PlacementTestResponseDto] })
  listTests(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.tests.listForStudent(studentId);
  }

  @Post('students/:studentId/placement-tests')
  @Roles('admin', 'front_desk')
  @ApiOperation({
    summary:
      'Record a diagnostic placement test (does not change CEFR until confirmed)',
  })
  @ApiCreatedResponse({ type: PlacementTestResponseDto })
  recordTest(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() body: RecordPlacementTestDto,
  ) {
    return this.tests.record({ ...body, studentId });
  }

  @Post('placement-tests/:id/confirm')
  @Roles('admin', 'front_desk')
  @ApiOperation({
    summary: 'Confirm a placement test and apply CEFR when allowed',
  })
  @ApiOkResponse({ type: PlacementTestResponseDto })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtUser,
  ) {
    return this.tests.confirm({
      placementTestId: id,
      actorUserId: actor.id,
    });
  }

  @Get('students/:studentId/level-history')
  @Roles('admin', 'front_desk', 'teacher')
  @ApiOperation({ summary: 'List CEFR level history for a student' })
  @ApiOkResponse({ type: [StudentLevelHistoryResponseDto] })
  listHistory(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.tests.listHistory(studentId);
  }
}
