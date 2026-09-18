import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CoursesModule } from '../courses/courses.module.js';
import { StudentsModule } from '../students/students.module.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsRepository } from './enrollments.repository.js';
import { EnrollmentsService } from './enrollments.service.js';

@Module({
  imports: [AuthModule, StudentsModule, CoursesModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsRepository, EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
