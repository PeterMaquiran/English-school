import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  adminAdjustCefrInputSchema,
  applyApprovedEvaluationInputSchema,
  createStudentInputSchema,
  isCefrLower,
  isValidTargetLevel,
  updateStudentTargetLevelInputSchema,
  type AdminAdjustCefrInput,
  type ApplyApprovedEvaluationInput,
  type CreateStudentInput,
  type Student,
  type UpdateStudentTargetLevelInput,
} from '@english-school/shared';
import { UsersService } from '../users/users.service.js';
import { StudentLevelHistoryRepository } from '../placement/student-level-history.repository.js';
import { StudentsRepository } from './students.repository.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly students: StudentsRepository,
    private readonly users: UsersService,
    private readonly levelHistory: StudentLevelHistoryRepository,
  ) {}

  async create(raw: CreateStudentInput): Promise<Student> {
    const input = createStudentInputSchema.parse(raw);
    if (!isValidTargetLevel(input.cefrLevel, input.targetLevel)) {
      throw new BadRequestException(
        'target_level must be greater than or equal to cefr_level',
      );
    }

    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'student') {
      throw new BadRequestException('User must have role student');
    }

    const existing = await this.students.findByUserId(input.userId);
    if (existing) {
      throw new ConflictException(
        'Student profile already exists for this user',
      );
    }

    return this.students.create(input);
  }

  async getById(id: string): Promise<Student> {
    const student = await this.students.findById(id);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async updateTargetLevel(
    raw: UpdateStudentTargetLevelInput,
  ): Promise<Student> {
    const input = updateStudentTargetLevelInputSchema.parse(raw);
    const student = await this.getById(input.studentId);
    if (!isValidTargetLevel(student.cefrLevel, input.targetLevel)) {
      throw new BadRequestException(
        'target_level must be greater than or equal to cefr_level',
      );
    }
    return this.students.updateLevels(student.id, {
      targetLevel: input.targetLevel,
    });
  }

  async adminAdjustCefr(raw: AdminAdjustCefrInput): Promise<Student> {
    const input = adminAdjustCefrInputSchema.parse(raw);
    const student = await this.getById(input.studentId);
    if (!isValidTargetLevel(input.toLevel, student.targetLevel)) {
      throw new BadRequestException(
        'target_level must be greater than or equal to the new cefr_level',
      );
    }
    if (student.cefrLevel === input.toLevel) {
      return student;
    }

    const updated = await this.students.updateLevels(student.id, {
      cefrLevel: input.toLevel,
    });
    await this.levelHistory.append({
      studentId: student.id,
      fromLevel: student.cefrLevel,
      toLevel: input.toLevel,
      source: 'admin',
      actorUserId: input.actorUserId,
    });
    return updated;
  }

  async applyApprovedEvaluation(
    raw: ApplyApprovedEvaluationInput,
  ): Promise<Student> {
    const input = applyApprovedEvaluationInputSchema.parse(raw);
    const student = await this.getById(input.studentId);

    if (student.cefrLevel && isCefrLower(input.toLevel, student.cefrLevel)) {
      throw new BadRequestException(
        'Evaluations cannot lower CEFR; Admin must downgrade with a reason',
      );
    }
    if (!isValidTargetLevel(input.toLevel, student.targetLevel)) {
      throw new BadRequestException(
        'target_level must be greater than or equal to the new cefr_level',
      );
    }
    if (student.cefrLevel === input.toLevel) {
      return student;
    }

    const updated = await this.students.updateLevels(student.id, {
      cefrLevel: input.toLevel,
    });
    await this.levelHistory.append({
      studentId: student.id,
      fromLevel: student.cefrLevel,
      toLevel: input.toLevel,
      source: 'evaluation',
      actorUserId: input.actorUserId,
    });
    return updated;
  }
}
