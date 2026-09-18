import { configureZenTrace } from 'zentrace';
import { enableLokiExport } from 'zentrace/exporters/loki';
import { enableZipkinExport } from 'zentrace/exporters/zipkin';

const ZIPKIN_URL =
  process.env.NEXT_PUBLIC_ZIPKIN_URL ?? 'http://zipkin:9411/api/v2/spans';
const SERVICE_NAME =
  process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? 'english-school-web';

configureZenTrace({ capture: true });
enableZipkinExport({
  endpoint: ZIPKIN_URL,
  serviceName: SERVICE_NAME,
});

enableLokiExport({
  endpoint: process.env.NEXT_PUBLIC_LOKI_URL,
  serviceName: 'english-school-web',
  labels: { environment: 'development' },
  nestFields: true,
  authToken: process.env.NEXT_PUBLIC_LOKI_AUTH_TOKEN,
});
