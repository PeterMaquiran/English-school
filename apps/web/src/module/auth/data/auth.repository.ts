import type { ApiClient, ApiRequestOptions } from '@/infra/http';
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
  LogoutResponse,
} from './dtos';
import { Span, trace } from 'zentrace';

export class AuthRepository {
  constructor(private readonly http: ApiClient) {}

  @trace({ module: 'AuthRepository.login', captureArgs: false })
  login(input: LoginInput, span?: Span) {
    return this.http.post<LoginResponse, LoginInput>('/auth/login', input, {
      span,
    });
  }

  logout() {
    return this.http.post<LogoutResponse>('/auth/logout');
  }

  me(options?: ApiRequestOptions) {
    return this.http.get<AuthUser>('/auth/me', undefined, options);
  }
}
