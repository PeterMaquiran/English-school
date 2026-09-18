import { BadRequestException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { ZodError } from 'zod';

export function formatZodIssues(error: ZodError): {
  message: string;
  issues: { path: string; message: string }[];
} {
  const issues = error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.map(String).join('.') : 'body',
    message: issue.message,
  }));
  return {
    message: issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; '),
    issues,
  };
}

export function parseBody<T>(
  schema: { parse: (data: unknown) => T },
  raw: unknown,
): T {
  const payload = raw && typeof raw === 'object' ? instanceToPlain(raw) : raw;
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException(formatZodIssues(error));
    }
    throw error;
  }
}
