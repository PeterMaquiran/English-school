import { authRepository } from "../auth-module";
import type { LoginInput } from "../data/dtos";

export function login(input: LoginInput) {
  return authRepository.login(input);
}
