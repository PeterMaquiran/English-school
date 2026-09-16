import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "web",
    environment: process.env.NODE_ENV ?? "development",
  },
  redact: {
    paths: [
      "headers.authorization",
      "headers.cookie",
      'headers["x-api-key"]',
      "authorization",
      "cookie",
    ],
    censor: "[Redacted]",
  },
});
