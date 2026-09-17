import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth-cookies.js';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, this.accessOptions());
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, this.refreshOptions());
  }

  clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, this.baseOptions());
    response.clearCookie(REFRESH_COOKIE, this.baseOptions());
  }

  private accessOptions(): CookieOptions {
    return {
      ...this.baseOptions(),
      maxAge: this.config.getOrThrow<number>('jwt.accessTtlSeconds') * 1000,
    };
  }

  private refreshOptions(): CookieOptions {
    const refreshTtlSeconds = this.config.getOrThrow<number>(
      'jwt.refreshTtlSeconds',
    );
    return {
      ...this.baseOptions(),
      maxAge: refreshTtlSeconds * 1000,
    };
  }

  private baseOptions(): CookieOptions {
    const isProd = this.config.get<string>('nodeEnv') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    };
  }
}
