import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PAY_LATER_DAYS,
  groupCourseLevelFit,
  seatStudentInputSchema,
  type Enrollment,
  type SeatStudentInput,
} from '@english-school/shared';
import { CoursesRepository } from '../courses/courses.repository.js';
import { StudentsRepository } from '../students/students.repository.js';
import { EnrollmentsRepository } from './enrollments.repository.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollments: EnrollmentsRepository,
    private readonly students: StudentsRepository,
    private readonly courses: CoursesRepository,
  ) {}

  async listForBatch(batchId: string) {
    const batch = await this.courses.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundException('Class not found');
    }
    return this.enrollments.listForBatch(batchId);
  }

  async listForStudent(studentId: string) {
    const student = await this.students.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.enrollments.listForStudent(studentId);
  }

  async seat(batchId: string, raw: SeatStudentInput): Promise<Enrollment> {
    const input = seatStudentInputSchema.parse(raw);
    const batch = await this.courses.findBatchById(batchId);
    if (!batch) {
      throw new NotFoundException('Class not found');
    }
    if (batch.courseType !== 'group') {
      throw new BadRequestException('This class is not a group cohort');
    }

    const student = await this.students.findById(input.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (!student.cefrLevel) {
      throw new BadRequestException(
        'Confirm a placement before seating this student',
      );
    }

    const fit = groupCourseLevelFit(student.cefrLevel, batch.cefrLevel);
    if (fit === 'blocked') {
      throw new BadRequestException(
        'A group class must be the student’s level, or one level above',
      );
    }
    if (fit === 'one_above' && !input.overrideReason) {
      throw new BadRequestException(
        'Seating one level above needs a written reason',
      );
    }

    const already = await this.enrollments.findOpenSeat(student.id, batch.id);
    if (already) {
      throw new ConflictException(
        'This student already has a seat in the class',
      );
    }

    const taken = await this.enrollments.countSeats(batch.id);
    if (taken >= batch.capacity) {
      throw new ConflictException('This class is full');
    }

    const payLater = input.payLater === true;
    const due = new Date();
    due.setUTCHours(0, 0, 0, 0);
    if (payLater) {
      due.setUTCDate(due.getUTCDate() + PAY_LATER_DAYS);
    }

    return this.enrollments.createSeat({
      studentId: student.id,
      batchId: batch.id,
      status: payLater ? 'active' : 'pending_payment',
      levelOverrideReason:
        fit === 'one_above' ? (input.overrideReason ?? null) : null,
      amount: batch.tuitionAmount,
      currency: batch.currency,
      dueDate: due,
      description: `Group seat · ${batch.courseName}`,
    });
  }

  async collect(invoiceId: string): Promise<Enrollment> {
    const invoice = await this.enrollments.findInvoice(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.paymentStatus === 'paid') {
      const enrollment = invoice.enrollmentId
        ? await this.enrollments.findById(invoice.enrollmentId)
        : null;
      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }
      return enrollment;
    }
    if (
      invoice.paymentStatus !== 'open' &&
      invoice.paymentStatus !== 'overdue'
    ) {
      throw new BadRequestException('This invoice cannot be collected');
    }
    return this.enrollments.collectInvoice(invoiceId);
  }
}
