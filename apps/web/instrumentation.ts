import type { Instrumentation } from "next";
import { logger } from "./logger";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const requestIdHeader = request.headers["x-request-id"];
  const requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;

  logger.error(
    {
      event: "http.request.error",
      err: error,
      requestId,
      http: {
        method: request.method,
        path: request.path.split("?")[0],
      },
      next: {
        routePath: context.routePath,
        routeType: context.routeType,
        routerKind: context.routerKind,
      },
    },
    `${request.method} ${request.path.split("?")[0]} failed`,
  );
};
