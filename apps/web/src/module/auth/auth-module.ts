import { apiClient } from "@/infra/http";
import { AuthRepository } from "./data/auth.repository";

export const authRepository = new AuthRepository(apiClient);
