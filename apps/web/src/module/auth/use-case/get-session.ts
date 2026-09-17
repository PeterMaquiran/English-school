import { authRepository } from "../auth-module";

export function getSession() {
  return authRepository.me();
}
