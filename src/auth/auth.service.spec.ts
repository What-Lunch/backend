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

type TokenDeleteManyFilter = {
  userId: string;
};

type TokenCreateInput = {
  value: string;
  userId: string;
  expiresAt: Date;
};

type LoginResult = {
  accessToken: string;
  expiresAt: Date;
};

describe('로그인 테스트', () => {
  let authService: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn<Promise<UserLike | null>, [string]>(),
  };

  const tokenModelMock = {
    deleteMany: jest.fn<Promise<{ deletedCount: number }>, [TokenDeleteManyFilter]>(),
    create: jest.fn<Promise<{ _id: string }>, [TokenCreateInput]>(),
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

    // Act
    const result: LoginResult = await authService.login({
      email: 'test@example.com',
      password: 'pw',
    });

    // 인증 단계
    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(compareMock).toHaveBeenCalledWith('pw', passwordHash);

    // 유저당 1토큰: 기존 토큰 정리
    expect(tokenModelMock.deleteMany).toHaveBeenCalledTimes(1);
    const [deleteArg] = tokenModelMock.deleteMany.mock.calls[0];
    expect(deleteArg).toEqual({ userId });

    // 새 토큰 저장: matcher를 인자에 직접 쓰지 말고, 실제 인자를 꺼내 검증
    expect(tokenModelMock.create).toHaveBeenCalledTimes(1);
    const [createArg] = tokenModelMock.create.mock.calls[0];

    expect(createArg.userId).toBe(userId);
    expect(createArg.value).toHaveLength(64);
    expect(createArg.value).toMatch(/^[0-9a-f]{64}$/);
    expect(createArg.expiresAt).toBeInstanceOf(Date);

    // 반환 값
    expect(result.accessToken).toHaveLength(64);
    expect(result.accessToken).toMatch(/^[0-9a-f]{64}$/);
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

    const result: LoginResult = await authService.login({
      email: 'test@example.com',
      password: 'pw',
    });

    const after = Date.now();

    // 토큰 형식
    expect(result.accessToken).toHaveLength(64);

    // 만료 시간이 24시간으로 설정되었는지
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const expiresAtMs = result.expiresAt.getTime();

    // 최대 (호출 직후 + 24h) 이하여야 함
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + ONE_DAY_MS);
    expect(expiresAtMs).toBeLessThanOrEqual(after + ONE_DAY_MS);
  });

  it('실패: 이메일이 존재하지 않으면 UnauthorizedException을 던지고 토큰 작업은 하지 않는다', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce(null);

    await expect(authService.login({ email: 'nope@example.com', password: 'pw' })).rejects.toThrow(
      UnauthorizedException,
    );

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

  it('실패: 기존 토큰 정리가 실패하면 ServiceUnavailableException을 던진다', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce({
      _id: 'user-id-1',
      email: 'test@example.com',
      passwordHash: '$2b$10$dummyhash',
    });
    compareMock.mockResolvedValueOnce(true);

    tokenModelMock.deleteMany.mockRejectedValueOnce(new Error('db error'));

    // Act + Assert
    await expect(authService.login({ email: 'test@example.com', password: 'pw' })).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(tokenModelMock.create).not.toHaveBeenCalled();
  });

  it('실패: 새 토큰 저장이 실패하면 ServiceUnavailableException을 던진다', async () => {
    // Arrange
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

    expect(tokenModelMock.deleteMany).toHaveBeenCalledTimes(1);
    const [deleteArg] = tokenModelMock.deleteMany.mock.calls[0];
    expect(deleteArg).toEqual({ userId });

    expect(tokenModelMock.create).toHaveBeenCalledTimes(1);
  });
});
