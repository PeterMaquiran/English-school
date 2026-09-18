import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { StudentLevelHistoryRepository } from '../placement/student-level-history.repository.js';
import { StudentsController } from './students.controller.js';
import { StudentsRepository } from './students.repository.js';
import { StudentsService } from './students.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StudentsController],
  providers: [
    StudentsRepository,
    StudentsService,
    StudentLevelHistoryRepository,
  ],
  exports: [StudentsRepository, StudentsService, StudentLevelHistoryRepository],
})
export class StudentsModule {}
