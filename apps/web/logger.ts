import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
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
