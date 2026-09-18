import type { ApiClient } from '@/infra/http';
import type {
  Batch,
  Course,
  CreateBatchInput,
  CreateCourseInput,
  Enrollment,
  HireTeacherInput,
  LessonSession,
  LessonSessionDetail,
  MarkAttendanceInput,
  SeatStudentInput,
  Teacher,
  UpdateSessionStatusInput,
} from './dtos';

export class ClassesRepository {
  constructor(private readonly http: ApiClient) {}

  listTeachers() {
    return this.http.get<Teacher[]>('/teachers');
  }

  hireTeacher(input: HireTeacherInput) {
    return this.http.post<Teacher, HireTeacherInput>('/teachers', input);
  }

  listCourses() {
    return this.http.get<Course[]>('/courses');
  }

  createCourse(input: CreateCourseInput) {
    return this.http.post<Course, CreateCourseInput>('/courses', input);
  }

  getCourse(courseId: string) {
    return this.http.get<Course>(`/courses/${courseId}`);
  }

  listBatches(courseId?: string) {
    if (courseId) {
      return this.http.get<Batch[]>(`/courses/${courseId}/batches`);
    }
    return this.http.get<Batch[]>('/batches');
  }

  createBatch(courseId: string, input: CreateBatchInput) {
    return this.http.post<Batch, CreateBatchInput>(
      `/courses/${courseId}/batches`,
      input,
    );
  }

  getBatch(batchId: string) {
    return this.http.get<Batch>(`/batches/${batchId}`);
  }

  listBatchEnrollments(batchId: string) {
    return this.http.get<Enrollment[]>(`/batches/${batchId}/enrollments`);
  }

  listStudentEnrollments(studentId: string) {
    return this.http.get<Enrollment[]>(`/students/${studentId}/enrollments`);
  }

  seatStudent(batchId: string, input: SeatStudentInput) {
    return this.http.post<Enrollment, SeatStudentInput>(
      `/batches/${batchId}/enrollments`,
      input,
    );
  }

  collectInvoice(invoiceId: string) {
    return this.http.post<Enrollment>(`/invoices/${invoiceId}/collect`);
  }

  listSessions(query?: { from?: string; to?: string; batchId?: string }) {
    return this.http.get<LessonSession[]>('/sessions', query);
  }

  getSession(sessionId: string) {
    return this.http.get<LessonSessionDetail>(`/sessions/${sessionId}`);
  }

  updateSessionStatus(sessionId: string, input: UpdateSessionStatusInput) {
    return this.http.patch<LessonSession, UpdateSessionStatusInput>(
      `/sessions/${sessionId}`,
      input,
    );
  }

  markAttendance(sessionId: string, input: MarkAttendanceInput) {
    return this.http.put<LessonSessionDetail, MarkAttendanceInput>(
      `/sessions/${sessionId}/attendance`,
      input,
    );
  }
}
