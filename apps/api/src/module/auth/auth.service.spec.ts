import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

const users = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
};
const prisma = {
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};
const jwt = {
  signAsync: vi.fn(),
  verifyAsync: vi.fn(),
};
const config = {
  getOrThrow: vi.fn((key: string) => {
    if (key === 'jwt.refreshTtlSeconds') return 60;
    if (key === 'jwt.accessSecret') return 'access';
    if (key === 'jwt.refreshSecret') return 'refresh';
    if (key === 'jwt.accessTtlSeconds') return 900;
    throw new Error(`unexpected ${key}`);
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      users as never,
      prisma as never,
      jwt as never,
      config as never,
    );
  });

  it('rejects unknown credentials', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.login('nobody@school.local', 'secret'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a public user after a valid password', async () => {
    const { default: bcrypt } = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('secret', 4);
    users.findByEmail.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Ada',
      email: 'ada@school.local',
      passwordHash,
      role: 'admin',
    });
    prisma.refreshToken.create.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
    });
    jwt.signAsync.mockResolvedValueOnce('access-token');
    jwt.signAsync.mockResolvedValueOnce('refresh-token');

    const result = await service.login('ada@school.local', 'secret');

    expect(result.user).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Ada',
      email: 'ada@school.local',
      role: 'admin',
    });
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
