import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenPayload } from './jwt.strategy.js';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: User['role'];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RefreshTokenPayload = {
  sub: string;
  jti: string;
};

const DUMMY_PASSWORD_HASH =
  '$2b$10$C6UzMDM.H6dfI/f/IKcEe.OQ5j4mYk7m2Yc5kq1o0G1sO7nS8yOaK';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: PublicUser;
    tokens: AuthTokens;
  }> {
    const user = await this.users.findByEmail(email);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user?.passwordHash || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    return { user: toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({
        where: { id: payload.jti, userId: payload.sub },
      });
    } catch {
      return;
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toPublicUser(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const refreshTtlSeconds = this.config.getOrThrow<number>(
      'jwt.refreshTtlSeconds',
    );
    const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);
    const refreshRow = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshRow.id,
    };

    const accessTtlSeconds = this.config.getOrThrow<number>(
      'jwt.accessTtlSeconds',
    );
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessTtlSeconds,
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshTtlSeconds,
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    refreshToken: string | undefined,
  ): Promise<RefreshTokenPayload> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
