import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Token } from './schemas/token.schema';

const compareMock = jest.fn<Promise<boolean>, [string, string]>();

jest.mock('bcrypt', () => ({
  compare: (...args: [string, string]) => compareMock(...args),
}));

type UserLike = {
  _id: string;
  email: string;
  passwordHash: string;
};

describe('로그인 테스트', () => {
  let authService: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn<Promise<UserLike | null>, [string]>(),
  };

  const tokenModelMock = {
    deleteMany: jest.fn<Promise<{ deletedCount: number }>, [{ userId: string }]>(),
    create: jest.fn<Promise<unknown>, [Record<string, unknown>]>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: getModelToken(Token.name), useValue: tokenModelMock },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('성공: 올바른 이메일/비밀번호면 토큰을 발급하고 DB에 저장한다', async () => {
    const userId = 'user-id-1';
    const passwordHash = '$2b$10$dummyhash';

    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: userId,
      email: 'test@example.com',
      passwordHash,
    });
    compareMock.mockResolvedValueOnce(true);

    tokenModelMock.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
    tokenModelMock.create.mockResolvedValueOnce({ _id: 'token-id-1' });

    const result = await authService.login({ email: 'test@example.com', password: 'pw' });

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(compareMock).toHaveBeenCalledWith('pw', passwordHash);

    // 유저당 1토큰: 기존 토큰 정리 후 새 토큰 저장
    expect(tokenModelMock.deleteMany).toHaveBeenCalledWith({ userId });
    expect(tokenModelMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        value: expect.any(String),
        userId,
        expiresAt: expect.any(Date),
      }),
    );

    // 검증 반환 값
    expect(result.accessToken).toHaveLength(64);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('성공: 올바른 이메일/비밀번호면 24시간 유효한 토큰을 발급한다', async () => {
    const userId = 'user-id-1';
    const passwordHash = '$2b$10$dummyhash';

    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: userId,
      email: 'test@example.com',
      passwordHash,
    });
    compareMock.mockResolvedValueOnce(true);

    tokenModelMock.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
    tokenModelMock.create.mockResolvedValueOnce({ _id: 'token-id-1' });

    const before = Date.now();

    const result = await authService.login({
      email: 'test@example.com',
      password: 'pw',
    });

    const after = Date.now();

    // 토큰 형식
    expect(result.accessToken).toHaveLength(64);

    // 만료 시간이 24시간으로 설정되었는지
    const ttl = result.expiresAt.getTime() - before;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    expect(ttl).toBeGreaterThanOrEqual(ONE_DAY_MS);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + ONE_DAY_MS);
  });

  it('실패: 이메일이 존재하지 않으면 UnauthorizedException을 던지고 토큰 작업은 하지 않는다', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce(null);

    await expect(authService.login({ email: 'nope@example.com', password: 'pw' })).rejects.toThrow(
      UnauthorizedException,
    );

    // 불필요한 작업이 실행되지 않아야 함
    expect(compareMock).not.toHaveBeenCalled();
    expect(tokenModelMock.deleteMany).not.toHaveBeenCalled();
    expect(tokenModelMock.create).not.toHaveBeenCalled();
  });

  it('실패: 비밀번호가 틀리면 UnauthorizedException을 던지고 토큰 작업은 하지 않는다', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: 'user-id-1',
      email: 'test@example.com',
      passwordHash: '$2b$10$dummyhash',
    });
    compareMock.mockResolvedValueOnce(false);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(tokenModelMock.deleteMany).not.toHaveBeenCalled();
    expect(tokenModelMock.create).not.toHaveBeenCalled();
  });

  it('실패: 기존 토큰 정리(deleteMany)가 실패하면 ServiceUnavailableException을 던진다', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: 'user-id-1',
      email: 'test@example.com',
      passwordHash: '$2b$10$dummyhash',
    });
    compareMock.mockResolvedValueOnce(true);

    tokenModelMock.deleteMany.mockRejectedValueOnce(new Error('db error'));

    await expect(authService.login({ email: 'test@example.com', password: 'pw' })).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(tokenModelMock.create).not.toHaveBeenCalled();
  });

  it('실패: 새 토큰 저장(create)이 실패하면 ServiceUnavailableException을 던진다', async () => {
    const userId = 'user-id-1';

    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: userId,
      email: 'test@example.com',
      passwordHash: '$2b$10$dummyhash',
    });
    compareMock.mockResolvedValueOnce(true);

    tokenModelMock.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });
    tokenModelMock.create.mockRejectedValueOnce(new Error('db down'));

    await expect(authService.login({ email: 'test@example.com', password: 'pw' })).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(tokenModelMock.deleteMany).toHaveBeenCalledWith({ userId });
    expect(tokenModelMock.create).toHaveBeenCalled();
  });
});
