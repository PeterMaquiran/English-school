import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import configuration from './config/configuration.js';
import { AuthModule } from './module/auth/auth.module.js';
import { UsersModule } from './module/users/users.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

function pathWithoutQuery(url?: string): string {
  return url?.split('?')[0] ?? '/';
}

const pinoPrettyTransport =
  process.env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      };

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: pinoPrettyTransport,
        base: {
          service: 'api',
          environment: process.env.NODE_ENV ?? 'development',
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-api-key"]',
            'res.headers["set-cookie"]',
          ],
          censor: '[Redacted]',
        },
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            path: pathWithoutQuery(req.url),
            userAgent: req.headers['user-agent'],
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
          }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const requestId =
            typeof header === 'string' && header.length <= 128
              ? header
              : randomUUID();

          res.setHeader('x-request-id', requestId);
          return requestId;
        },
        customProps: (req) => {
          const cloudflareIp = req.headers['cf-connecting-ip'];
          const forwardedFor = req.headers['x-forwarded-for'];
          const clientIp =
            (typeof cloudflareIp === 'string' && cloudflareIp) ||
            (typeof forwardedFor === 'string' &&
              forwardedFor.split(',')[0]?.trim()) ||
            req.socket.remoteAddress;

          return {
            clientIp,
            cfRay:
              typeof req.headers['cf-ray'] === 'string'
                ? req.headers['cf-ray']
                : undefined,
          };
        },
        customLogLevel: (_req, res, error) => {
          if (error || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        customSuccessMessage: (req, res) =>
          `${req.method} ${pathWithoutQuery(req.url)} completed with ${res.statusCode}`,
        customErrorMessage: (req, res) =>
          `${req.method} ${pathWithoutQuery(req.url)} failed with ${res.statusCode}`,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
