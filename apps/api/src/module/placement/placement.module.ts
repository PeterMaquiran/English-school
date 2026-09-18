import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StudentsModule } from '../students/students.module.js';
import { PlacementController } from './placement.controller.js';
import { PlacementScoreBandsRepository } from './placement-score-bands.repository.js';
import { PlacementScoreBandsService } from './placement-score-bands.service.js';
import { PlacementTestsRepository } from './placement-tests.repository.js';
import { PlacementTestsService } from './placement-tests.service.js';

@Module({
  imports: [AuthModule, StudentsModule],
  controllers: [PlacementController],
  providers: [
    PlacementScoreBandsRepository,
    PlacementScoreBandsService,
    PlacementTestsRepository,
    PlacementTestsService,
  ],
  exports: [PlacementTestsService, PlacementScoreBandsService],
})
export class PlacementModule {}
