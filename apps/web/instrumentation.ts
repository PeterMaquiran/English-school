import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelemetry } = await import('./telemetry');
    startTelemetry();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const { logger } = await import('./logger');
  const requestIdHeader = request.headers['x-request-id'];
  const requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;

  logger.error(
    {
      event: 'http.request.error',
      err: error,
      requestId,
      http: {
        method: request.method,
        path: request.path.split('?')[0],
      },
      next: {
        routePath: context.routePath,
        routeType: context.routeType,
        routerKind: context.routerKind,
      },
    },
    `${request.method} ${request.path.split('?')[0]} failed`,
  );
};
