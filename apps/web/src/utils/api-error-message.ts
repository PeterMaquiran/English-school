import { ApiError } from '@/infra/http/api-error';

type Issue = { path?: string; message?: string };

function messageFromBody(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (typeof body !== 'object' || body === null) {
    return undefined;
  }

  const record = body as {
    message?: unknown;
    issues?: Issue[];
  };

  if (Array.isArray(record.issues) && record.issues.length > 0) {
    return record.issues
      .map((issue) =>
        issue.path
          ? `${issue.path}: ${issue.message ?? 'Invalid'}`
          : (issue.message ?? 'Invalid'),
      )
      .join('; ');
  }

  if (
    record.message &&
    typeof record.message === 'object' &&
    !Array.isArray(record.message)
  ) {
    return messageFromBody(record.message);
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  if (Array.isArray(record.message)) {
    const parts = record.message.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object' && 'message' in item) {
        return String((item as { message: unknown }).message);
      }
      return null;
    });
    const first = parts.find((item) => item && item.trim());
    return first ?? undefined;
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
