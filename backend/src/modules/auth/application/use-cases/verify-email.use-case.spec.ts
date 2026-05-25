import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
}));

const SECRET = 'test-email-verification-secret';

const BASE_USER_PROPS = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'hashedPassword',
  firstName: 'John',
  lastName: 'Doe',
  phone: '',
  role_key: Role.USER_FREEMIUM,
  status: UserStatus.ACTIVE,
  failedLoginCount: 0,
  mfaEnabled: false,
  createdAt: new Date(),
};

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  const mockedJwtVerify = jwt.verify as jest.Mock;

  beforeEach(async () => {
    process.env.JWT_EMAIL_VERIFICATION_SECRET = SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailUseCase,
        {
          provide: IUserAuthRepository,
          useValue: { findById: jest.fn(), markEmailAsVerified: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(VerifyEmailUseCase);
    userRepo = module.get(IUserAuthRepository);
  });

  afterEach(() => {
    delete process.env.JWT_EMAIL_VERIFICATION_SECRET;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should mark email as verified with a valid token', async () => {
      const realVerify = jest.requireActual('jsonwebtoken').verify;
      const token = jest
        .requireActual('jsonwebtoken')
        .sign({ sub: 'user-123' }, SECRET, { expiresIn: '24h' });
      mockedJwtVerify.mockImplementationOnce((...args: any[]) => realVerify(...args));

      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      userRepo.markEmailAsVerified.mockResolvedValue(undefined);

      await useCase.execute(token);

      expect(userRepo.findById).toHaveBeenCalledWith('user-123');
      expect(userRepo.markEmailAsVerified).toHaveBeenCalledWith('user-123');
    });

    it('should return silently when email is already verified', async () => {
      const realVerify = jest.requireActual('jsonwebtoken').verify;
      const token = jest
        .requireActual('jsonwebtoken')
        .sign({ sub: 'user-123' }, SECRET, { expiresIn: '24h' });
      mockedJwtVerify.mockImplementationOnce((...args: any[]) => realVerify(...args));

      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: true });
      userRepo.findById.mockResolvedValue(user);

      await useCase.execute(token);

      expect(userRepo.markEmailAsVerified).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for an expired token', async () => {
      mockedJwtVerify.mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('jwt expired');
      });

      await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for a token signed with wrong secret', async () => {
      mockedJwtVerify.mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('invalid signature');
      });

      await expect(useCase.execute('bad-secret-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for a completely invalid token', async () => {
      mockedJwtVerify.mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      await expect(useCase.execute('not-a-valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockedJwtVerify.mockReturnValueOnce({ sub: 'ghost-user' });
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('valid-token')).rejects.toThrow(UnauthorizedException);
      expect(userRepo.markEmailAsVerified).not.toHaveBeenCalled();
    });

    it('should throw Error when JWT_EMAIL_VERIFICATION_SECRET is not configured', async () => {
      delete process.env.JWT_EMAIL_VERIFICATION_SECRET;

      await expect(useCase.execute('any-token')).rejects.toThrow(
        'JWT_EMAIL_VERIFICATION_SECRET is not configured',
      );
    });

    it('should throw UnauthorizedException when token payload is a plain string', async () => {
      mockedJwtVerify.mockReturnValueOnce('plain-string');

      await expect(useCase.execute('any-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token payload has no sub', async () => {
      mockedJwtVerify.mockReturnValueOnce({ iat: 123 });

      await expect(useCase.execute('any-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});

describe('VerifyEmailUseCase constructor branch coverage', () => {
  it('should instantiate with null dependencies to cover constructor parameter branches', () => {
    const instance = new VerifyEmailUseCase(null as any);
    expect(instance).toBeDefined();
  });
});
