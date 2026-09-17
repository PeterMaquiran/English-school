import { configureZenTrace } from 'zentrace';
import { enableZipkinExport } from '@/infra/observability/zipkin-exporter';

const ZIPKIN_URL =
  process.env.NEXT_PUBLIC_ZIPKIN_URL ?? 'http://zipkin:9411/api/v2/spans';
const SERVICE_NAME =
  process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? 'english-school-web';

configureZenTrace({ capture: true });
enableZipkinExport({
  endpoint: ZIPKIN_URL,
  serviceName: SERVICE_NAME,
});
