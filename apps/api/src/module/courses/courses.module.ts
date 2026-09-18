import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TeachersModule } from '../teachers/teachers.module.js';
import { CoursesController } from './courses.controller.js';
import { CoursesRepository } from './courses.repository.js';
import { CoursesService } from './courses.service.js';

@Module({
  imports: [AuthModule, TeachersModule],
  controllers: [CoursesController],
  providers: [CoursesRepository, CoursesService],
  exports: [CoursesRepository, CoursesService],
})
export class CoursesModule {}
