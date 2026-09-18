import type { ApiClient } from '@/infra/http';
import type {
  AdminAdjustCefrBody,
  CreateStudentInput,
  EnrollStudentInput,
  Student,
  UpdateStudentTargetLevelBody,
} from './dtos';

export class StudentsRepository {
  constructor(private readonly http: ApiClient) {}

  enroll(input: EnrollStudentInput) {
    return this.http.post<Student, EnrollStudentInput>(
      '/students/enroll',
      input,
    );
  }

  create(input: CreateStudentInput) {
    return this.http.post<Student, CreateStudentInput>('/students', input);
  }

  list() {
    return this.http.get<Student[]>('/students');
  }

  getById(studentId: string) {
    return this.http.get<Student>(`/students/${studentId}`);
  }

  updateTargetLevel(studentId: string, input: UpdateStudentTargetLevelBody) {
    return this.http.patch<Student, UpdateStudentTargetLevelBody>(
      `/students/${studentId}/target-level`,
      input,
    );
  }

  adminAdjustCefr(studentId: string, input: AdminAdjustCefrBody) {
    return this.http.post<Student, AdminAdjustCefrBody>(
      `/students/${studentId}/cefr`,
      input,
    );
  }
}
