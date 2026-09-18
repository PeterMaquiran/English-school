import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/infra/observability/logger';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/utils/auth-cookies';

function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined
  );
}

const PUBLIC_PATHS = new Set(['/', '/login']);

export function proxy(request: NextRequest) {
  const incomingRequestId = request.headers.get('x-request-id');
  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-request-id', requestId);

  if (request.nextUrl.pathname.startsWith('/telemetry/')) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('x-request-id', requestId);
    return response;
  }

  logger.info(
    {
      event: 'http.request.received',
      requestId,
      clientIp: getClientIp(request),
      cfRay: request.headers.get('cf-ray') ?? undefined,
      http: {
        method: request.method,
        path: request.nextUrl.pathname,
      },
    },
    `${request.method} ${request.nextUrl.pathname} received`,
  );

  const path = request.nextUrl.pathname;
  const hasSession =
    Boolean(request.cookies.get(ACCESS_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (path.startsWith('/dashboard') && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set('x-request-id', requestId);
    return redirect;
  }

  if (
    PUBLIC_PATHS.has(path) &&
    hasSession &&
    (path === '/login' || path === '/')
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    const redirect = NextResponse.redirect(dashboardUrl);
    redirect.headers.set('x-request-id', requestId);
    return redirect;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
