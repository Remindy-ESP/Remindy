import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

jest.mock('jsonwebtoken');

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  let passwordService: jest.Mocked<IPasswordService>;

  const mockUser = new AuthUser({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'oldHashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '',
    role_key: Role.USER_FREEMIUM,
    status: UserStatus.ACTIVE,
    failedLoginCount: 0,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
  });

  beforeEach(async () => {
    const mockUserRepo: Partial<jest.Mocked<IUserAuthRepository>> = {
      findById: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
      hash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        {
          provide: IUserAuthRepository,
          useValue: mockUserRepo,
        },
        {
          provide: IPasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    useCase = module.get<ResetPasswordUseCase>(ResetPasswordUseCase);
    userRepo = module.get(IUserAuthRepository);
    passwordService = module.get(IPasswordService);

    process.env.JWT_PASSWORD_RESET_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const resetParams = {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePassword123!',
    };

    it('should successfully reset password with valid token', async () => {
      const tokenPayload = { sub: 'user-123' };
      const newPasswordHash = 'newHashedPassword';

      (jwt.verify as jest.Mock).mockReturnValue(tokenPayload);
      userRepo.findById.mockResolvedValue(mockUser);
      passwordService.hash.mockResolvedValue(newPasswordHash);
      userRepo.updatePassword.mockResolvedValue(undefined);

      await useCase.execute(resetParams);

      expect(jwt.verify).toHaveBeenCalledWith(resetParams.token, 'test-secret-key');
      expect(userRepo.findById).toHaveBeenCalledWith('user-123');
      expect(passwordService.hash).toHaveBeenCalledWith(resetParams.newPassword);
      expect(userRepo.updatePassword).toHaveBeenCalledWith('user-123', newPasswordHash);
    });

    it('should throw error when JWT_PASSWORD_RESET_SECRET is not configured', async () => {
      delete process.env.JWT_PASSWORD_RESET_SECRET;

      await expect(useCase.execute(resetParams)).rejects.toThrow(
        'JWT_PASSWORD_RESET_SECRET is not configured',
      );

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('Invalid or expired token');

      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token payload is a string', async () => {
      (jwt.verify as jest.Mock).mockReturnValue('string-payload');

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('Invalid token payload');

      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token has no sub claim', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ someOtherClaim: 'value' });

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('Invalid token payload');

      expect(userRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123' });
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('User not found');

      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(userRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('should hash new password before updating', async () => {
      const newPassword = 'MyNewPassword123';
      const hashedPassword = 'superSecureHash';

      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123' });
      userRepo.findById.mockResolvedValue(mockUser);
      passwordService.hash.mockResolvedValue(hashedPassword);
      userRepo.updatePassword.mockResolvedValue(undefined);

      await useCase.execute({ token: 'token', newPassword });

      expect(passwordService.hash).toHaveBeenCalledWith(newPassword);
      expect(userRepo.updatePassword).toHaveBeenCalledWith('user-123', hashedPassword);
    });

    it('should call updatePassword with correct user id and hashed password', async () => {
      const userId = 'specific-user-id';
      const hashedPassword = 'hashedNewPassword';

      const userWithSpecificId = new AuthUser({
        id: userId,
        email: 'test@example.com',
        passwordHash: 'oldHashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: true,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      (jwt.verify as jest.Mock).mockReturnValue({ sub: userId });
      userRepo.findById.mockResolvedValue(userWithSpecificId);
      passwordService.hash.mockResolvedValue(hashedPassword);
      userRepo.updatePassword.mockResolvedValue(undefined);

      await useCase.execute(resetParams);

      expect(userRepo.updatePassword).toHaveBeenCalledWith(userId, hashedPassword);
      expect(userRepo.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('should handle expired tokens', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('Invalid or expired token');
    });

    it('should handle malformed tokens', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await expect(useCase.execute(resetParams)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(resetParams)).rejects.toThrow('Invalid or expired token');
    });

    it('should use the correct JWT secret from environment', async () => {
      const customSecret = 'my-custom-secret';
      process.env.JWT_PASSWORD_RESET_SECRET = customSecret;

      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123' });
      userRepo.findById.mockResolvedValue(mockUser);
      passwordService.hash.mockResolvedValue('hashedPassword');
      userRepo.updatePassword.mockResolvedValue(undefined);

      await useCase.execute(resetParams);

      expect(jwt.verify).toHaveBeenCalledWith(resetParams.token, customSecret);
    });

    it('should complete successfully without returning a value', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123' });
      userRepo.findById.mockResolvedValue(mockUser);
      passwordService.hash.mockResolvedValue('hashedPassword');
      userRepo.updatePassword.mockResolvedValue(undefined);

      const result = await useCase.execute(resetParams);

      expect(result).toBeUndefined();
    });
  });
});
