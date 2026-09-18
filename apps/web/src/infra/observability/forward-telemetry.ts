const MAX_BODY_BYTES = 512 * 1024;

export async function forwardTelemetry(
  request: Request,
  targetUrl: string | undefined,
  extraHeaders?: HeadersInit,
): Promise<Response> {
  if (!targetUrl) {
    return new Response(null, { status: 204 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  const headers = new Headers({
    'content-type': request.headers.get('content-type') ?? 'application/json',
  });

  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });

    return new Response(null, { status: upstream.ok ? 204 : 502 });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export function lokiAuthHeader(): string | undefined {
  const token =
    process.env.LOKI_AUTH_TOKEN ?? process.env.NEXT_PUBLIC_LOKI_AUTH_TOKEN;

  if (!token) {
    return undefined;
  }

  return token.startsWith('Basic ') || token.startsWith('Bearer ')
    ? token
    : `Bearer ${token}`;
}

export function lokiPushUrl(): string | undefined {
  return process.env.LOKI_URL ?? process.env.NEXT_PUBLIC_LOKI_URL;
}

export function zipkinPushUrl(): string {
  return (
    process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ??
    process.env.ZIPKIN_URL ??
    process.env.ZIPKIN_ENDPOINT ??
    'http://127.0.0.1:9411/api/v2/spans'
  );
}
