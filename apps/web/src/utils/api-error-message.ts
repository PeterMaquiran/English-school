import { ApiError } from '@/infra/http/api-error';

function messageFromBody(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return undefined;
  }

  const message = (body as { message: unknown }).message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return undefined;
}

export function getApiErrorMessage(error: ApiError): string {
  const fromBody = messageFromBody(error.body);
  if (fromBody) {
    return fromBody;
  }

  if (error.status === 0) {
    return error.message || 'Unable to reach the API';
  }

  return error.message || `Request failed (${error.status})`;
}
