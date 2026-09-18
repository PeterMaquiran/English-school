import './config/load-env.js';
import './shared/utils/tracing.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import configuration from './config/configuration.js';

function flattenValidation(
  errors: ValidationError[],
  parent = '',
): { path: string; message: string }[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const current = Object.values(error.constraints ?? {}).map((message) => ({
      path,
      message,
    }));
    const children = error.children?.length
      ? flattenValidation(error.children, path)
      : [];
    return [...current, ...children];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = configuration();

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const issues = flattenValidation(errors);
        return new BadRequestException({
          message: issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join('; '),
          issues,
        });
      },
    }),
  );
  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('English School API')
    .setVersion('0.1')
    .addCookieAuth('es_access_token')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api', app, document);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port);
}
await bootstrap();
