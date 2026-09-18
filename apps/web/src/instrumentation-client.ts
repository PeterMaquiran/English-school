import { configureZenTrace } from 'zentrace';
import { enableLokiExport } from 'zentrace/exporters/loki';
import { enableZipkinExport } from 'zentrace/exporters/zipkin';

const SERVICE_NAME =
  process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME ?? 'english-school-web';
const environment = process.env.NODE_ENV ?? 'development';

configureZenTrace({
  capture: process.env.NODE_ENV !== 'production',
});

enableZipkinExport({
  endpoint: '/telemetry/zipkin',
  serviceName: SERVICE_NAME,
});

enableLokiExport({
  endpoint: '/telemetry/loki',
  serviceName: SERVICE_NAME,
  labels: { environment },
  nestFields: true,
});
