import { ApiClient } from "@/infra/http/api-client";

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001",
});
