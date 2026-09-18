import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  confirmPlacementTestInputSchema,
  isCefrLower,
  isValidTargetLevel,
  recordPlacementTestInputSchema,
  type ConfirmPlacementTestInput,
  type PlacementTest,
  type RecordPlacementTestInput,
  type StudentLevelHistory,
} from '@english-school/shared';
import { StudentsRepository } from '../students/students.repository.js';
import { PlacementScoreBandsService } from './placement-score-bands.service.js';
import { PlacementTestsRepository } from './placement-tests.repository.js';
import { StudentLevelHistoryRepository } from './student-level-history.repository.js';

@Injectable()
export class PlacementTestsService {
  constructor(
    private readonly tests: PlacementTestsRepository,
    private readonly students: StudentsRepository,
    private readonly bands: PlacementScoreBandsService,
    private readonly history: StudentLevelHistoryRepository,
  ) {}

  async record(raw: RecordPlacementTestInput): Promise<PlacementTest> {
    const input = recordPlacementTestInputSchema.parse(raw);
    const student = await this.students.findById(input.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const fromBands = await this.bands.recommendLevel(input.overall);
    const recommendedLevel = fromBands ?? input.recommendedLevel;
    if (!recommendedLevel) {
      throw new BadRequestException(
        'Overall score is outside configured bands and no recommendedLevel was provided',
      );
    }

    return this.tests.create({ ...input, recommendedLevel });
  }

  async listForStudent(studentId: string): Promise<PlacementTest[]> {
    const student = await this.students.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.tests.listByStudentId(studentId);
  }

  async listHistory(studentId: string): Promise<StudentLevelHistory[]> {
    const student = await this.students.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.history.listByStudentId(studentId);
  }

  async confirm(raw: ConfirmPlacementTestInput): Promise<PlacementTest> {
    const input = confirmPlacementTestInputSchema.parse(raw);
    const test = await this.tests.findById(input.placementTestId);
    if (!test) {
      throw new NotFoundException('Placement test not found');
    }
    if (test.confirmedAt) {
      throw new ConflictException('Placement test is already confirmed');
    }

    const student = await this.students.findById(test.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const nextLevel = test.recommendedLevel;
    if (student.cefrLevel && isCefrLower(nextLevel, student.cefrLevel)) {
      throw new BadRequestException(
        'Confirming a lower CEFR is not allowed; Admin must downgrade with a reason',
      );
    }
    if (!isValidTargetLevel(nextLevel, student.targetLevel)) {
      throw new BadRequestException(
        'target_level must be greater than or equal to the new cefr_level',
      );
    }

    const levelChanges = student.cefrLevel !== nextLevel;
    return this.tests.confirmAndApplyLevel({
      testId: test.id,
      actorUserId: input.actorUserId,
      confirmedAt: new Date(),
      studentId: student.id,
      fromLevel: student.cefrLevel,
      toLevel: nextLevel,
      writeHistory: levelChanges,
    });
  }
}
