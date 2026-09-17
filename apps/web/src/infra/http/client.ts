import { ApiClient } from '@/infra/http/api-client';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = new ApiClient({
  baseUrl: apiBaseUrl,
  refreshEndpoint: `${apiBaseUrl.replace(/\/+$/, '')}/auth/refresh`,
});
