import {
  forwardTelemetry,
  zipkinPushUrl,
} from '@/infra/observability/forward-telemetry';

export async function POST(request: Request) {
  return forwardTelemetry(request, zipkinPushUrl());
}
