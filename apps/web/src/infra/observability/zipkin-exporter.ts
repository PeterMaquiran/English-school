import {
  replaceExporter,
  unregisterExportersById,
  type Exporter,
  type SpanData,
} from 'zentrace';

// Mirrors `zentrace/dist/exporters/zipkin`, which the package does not expose
// through its `exports` map yet. Delete this file and import `enableZipkinExport`
// from 'zentrace' once a release publishes the subpath.

const DEFAULT_ENDPOINT = 'http://localhost:9411/api/v2/spans';

export const ZIPKIN_EXPORTER_ID = 'zipkin';

export type ZipkinExporterOptions = {
  /** Zipkin v2 spans endpoint. */
  endpoint?: string;
  /** Full `Authorization` header value, e.g. `Bearer <token>`. */
  authToken?: string;
  /** Extra request headers, merged after Content-Type / Authorization. */
  headers?: Record<string, string>;
  /** Overrides span `localEndpoint.serviceName`. */
  serviceName?: string;
};

// Captured on import, before `enableAutoTracing` patches `globalThis.fetch`, so
// exporting a span can never produce another span.
const untracedFetch =
  typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : undefined;

class ZipkinExporter implements Exporter {
  readonly exporterId = ZIPKIN_EXPORTER_ID;

  constructor(private readonly options: ZipkinExporterOptions = {}) {}

  async export(span: SpanData): Promise<void> {
    const send = untracedFetch ?? globalThis.fetch;
    const response = await send(this.options.endpoint ?? DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.options.authToken
          ? { Authorization: this.options.authToken }
          : {}),
        ...this.options.headers,
      },
      body: JSON.stringify([toZipkinSpan(span, this.options.serviceName)]),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(
        `Zipkin export failed (${response.status}): ${await response.text()}`,
      );
    }
  }
}

/** Register (or replace) a Zipkin exporter. */
export function enableZipkinExport(options: ZipkinExporterOptions = {}): void {
  replaceExporter(new ZipkinExporter(options));
}

/** Stop sending spans to Zipkin. */
export function disableZipkinExport(): void {
  unregisterExportersById(ZIPKIN_EXPORTER_ID);
}

const OMIT_TAGS = new Set(['zentrace.logs']);
const CAPTURED_IO_TAGS = new Set(['input', 'output']);

/** Zipkin v2 requires timestamp/duration as integer microseconds (long). */
function toZipkinSpan(
  span: SpanData,
  serviceName?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    traceId: span.traceId,
    id: span.id,
    name: span.name,
    timestamp: toLongMicros(span.timestamp) ?? 0,
    localEndpoint: {
      serviceName: serviceName ?? span.localEndpoint.serviceName,
    },
  };

  const duration = toLongMicros(span.duration);
  const tags = sanitizeTags(span.tags, span.userAttributeKeys);

  if (span.parentId) payload.parentId = span.parentId;
  if (duration !== undefined) payload.duration = duration;
  if (tags) payload.tags = tags;

  if (span.annotations?.length) {
    payload.annotations = span.annotations.map((annotation) => ({
      value: annotation.value,
      timestamp: toLongMicros(annotation.timestamp) ?? 0,
    }));
  }

  return payload;
}

// Captured args/results stay out of Zipkin unless set via `span.setAttribute`.
function sanitizeTags(
  tags: Record<string, string> | undefined,
  userAttributeKeys: string[] | undefined,
): Record<string, string> | undefined {
  if (!tags) return undefined;

  const userKeys = new Set(userAttributeKeys);
  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (OMIT_TAGS.has(key)) continue;
    if (CAPTURED_IO_TAGS.has(key) && !userKeys.has(key)) continue;
    next[key] = value;
  }

  return Object.keys(next).length ? next : undefined;
}

function toLongMicros(value: number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const rounded = Math.round(Number(value));
  return Number.isFinite(rounded) ? rounded : undefined;
}
