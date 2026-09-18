import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiAuth() {
  return applyDecorators(
    ApiCookieAuth('es_access_token'),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Missing or invalid session' }),
    ApiForbiddenResponse({ description: 'Insufficient role' }),
  );
}
