import type { ApiClient } from '@/infra/http';
import type {
  PlacementScoreBand,
  PlacementTest,
  RecordPlacementTestBody,
  ReplacePlacementScoreBandsInput,
  StudentLevelHistory,
} from './dtos';

export class PlacementRepository {
  constructor(private readonly http: ApiClient) {}

  listScoreBands() {
    return this.http.get<PlacementScoreBand[]>('/placement/score-bands');
  }

  replaceScoreBands(input: ReplacePlacementScoreBandsInput) {
    return this.http.put<PlacementScoreBand[], ReplacePlacementScoreBandsInput>(
      '/placement/score-bands',
      input,
    );
  }

  listTests(studentId: string) {
    return this.http.get<PlacementTest[]>(
      `/students/${studentId}/placement-tests`,
    );
  }

  recordTest(studentId: string, input: RecordPlacementTestBody) {
    return this.http.post<PlacementTest, RecordPlacementTestBody>(
      `/students/${studentId}/placement-tests`,
      input,
    );
  }

  confirmTest(placementTestId: string) {
    return this.http.post<PlacementTest>(
      `/placement-tests/${placementTestId}/confirm`,
    );
  }

  listLevelHistory(studentId: string) {
    return this.http.get<StudentLevelHistory[]>(
      `/students/${studentId}/level-history`,
    );
  }
}
