import { context, propagation } from '@opentelemetry/api';
import type { Span } from 'zentrace';

const REQUEST_ID_HEADER = 'x-request-id';

export function createRequestId(): string {
  return crypto.randomUUID();
}

export async function incomingRequestId(): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    return undefined;
  }

  try {
    const { headers } = await import('next/headers');
    return (await headers()).get(REQUEST_ID_HEADER) ?? undefined;
  } catch {
    return undefined;
  }
}

export function applyObservabilityHeaders(
  headers: Headers,
  requestId: string,
): void {
  headers.set(REQUEST_ID_HEADER, requestId);

  if (typeof window !== 'undefined') {
    return;
  }

  propagation.inject(context.active(), headers, {
    set(carrier, key, value) {
      carrier.set(key, value);
    },
  });
}

export function applySpanCorrelationHeaders(
  headers: Headers,
  span: Span | undefined,
): void {
  if (!span) {
    return;
  }

  // The browser registers a Zipkin exporter, so `traceparent` can parent the API
  // span. No exporter runs server-side; there OTel stays the wire format.
  if (typeof window !== 'undefined') {
    for (const [key, value] of Object.entries(span.getTraceHeaders())) {
      if (value) {
        headers.set(key, value);
      }
    }
    headers.set('x-zentrace-parent-span-id', span.context.spanId);
    return;
  }

  headers.set('x-trace-id', span.context.traceId);
  headers.set('x-span-id', span.context.spanId);

  if (span.context.parentId) {
    headers.set('x-parent-id', span.context.parentId);
  }
}

export async function logClientRequest(fields: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  error?: unknown;
}): Promise<void> {
  if (typeof window !== 'undefined') {
    return;
  }

  const { logger } = await import('@/infra/observability/logger');
  const payload = {
    event: 'http.client.request',
    requestId: fields.requestId,
    http: {
      method: fields.method,
      path: fields.path,
      status: fields.status,
      durationMs: Math.round(fields.durationMs),
      target: 'api',
    },
    err: fields.error,
  };

  const message = `${fields.method} ${fields.path} -> ${fields.status}`;

  if (fields.status >= 500 || fields.status === 0) {
    logger.error(payload, message);
    return;
  }

  if (fields.status >= 400) {
    logger.warn(payload, message);
    return;
  }

  logger.info(payload, message);
}
