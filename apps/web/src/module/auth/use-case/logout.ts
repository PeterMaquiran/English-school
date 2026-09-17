import { authRepository } from "../auth-module";

export function logout() {
  return authRepository.logout();
}
