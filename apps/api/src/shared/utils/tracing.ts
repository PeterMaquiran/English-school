import {
  CompositePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'english-school-api',
      'deployment.environment.name': process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: new ZipkinExporter({
      url:
        process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ??
        process.env.ZIPKIN_URL ??
        process.env.ZIPKIN_ENDPOINT ??
        'http://127.0.0.1:9411/api/v2/spans',
    }),
    textMapPropagator: new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
      ],
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      new PinoInstrumentation(),
    ],
  });

  sdk.start();

  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch (error: unknown) {
      console.error('Failed to shut down OpenTelemetry', error);
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
