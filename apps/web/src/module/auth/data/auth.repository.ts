import type { ApiClient, ApiRequestOptions } from "@/infra/http";
import type { AuthUser, LoginInput, LoginResponse, LogoutResponse } from "./dtos";

export class AuthRepository {
  constructor(private readonly http: ApiClient) {}

  login(input: LoginInput) {
    return this.http.post<LoginResponse, LoginInput>("/auth/login", input);
  }

  logout() {
    return this.http.post<LogoutResponse>("/auth/logout");
  }

  me(options?: ApiRequestOptions) {
    return this.http.get<AuthUser>("/auth/me", undefined, options);
  }
}
