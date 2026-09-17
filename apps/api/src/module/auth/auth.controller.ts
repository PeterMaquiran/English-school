import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import type { JwtUser } from '../../types/express.js';
import { AuthCookieService } from './auth-cookie.service.js';
import { REFRESH_COOKIE } from './auth-cookies.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, tokens } = await this.auth.login(dto.email, dto.password);
    this.cookies.setAuthCookies(response, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.auth.refresh(readRefreshCookie(request));
    this.cookies.setAuthCookies(response, tokens);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(readRefreshCookie(request));
    this.cookies.clearAuthCookies(response);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.id);
  }
}

function readRefreshCookie(request: Request): string | undefined {
  const token = request.cookies?.[REFRESH_COOKIE];
  return typeof token === 'string' ? token : undefined;
}
