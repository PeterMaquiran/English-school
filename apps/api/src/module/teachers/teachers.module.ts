import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { TeachersController } from './teachers.controller.js';
import { TeachersRepository } from './teachers.repository.js';
import { TeachersService } from './teachers.service.js';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TeachersController],
  providers: [TeachersRepository, TeachersService],
  exports: [TeachersRepository, TeachersService],
})
export class TeachersModule {}
