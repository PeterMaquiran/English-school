import {
  forwardTelemetry,
  lokiAuthHeader,
  lokiPushUrl,
} from '@/infra/observability/forward-telemetry';

export async function POST(request: Request) {
  const auth = lokiAuthHeader();

  return forwardTelemetry(
    request,
    lokiPushUrl(),
    auth ? { authorization: auth } : undefined,
  );
}
