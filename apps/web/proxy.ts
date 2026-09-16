import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "./logger";

function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}

export function proxy(request: NextRequest) {
  const incomingRequestId = request.headers.get("x-request-id");
  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-request-id", requestId);

  logger.info(
    {
      event: "http.request.received",
      requestId,
      clientIp: getClientIp(request),
      cfRay: request.headers.get("cf-ray") ?? undefined,
      http: {
        method: request.method,
        path: request.nextUrl.pathname,
      },
    },
    `${request.method} ${request.nextUrl.pathname} received`,
  );

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
