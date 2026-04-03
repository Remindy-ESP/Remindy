import { Test, TestingModule } from '@nestjs/testing';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { ITokenService } from '../../domain/services/token.service';
import { IEmailService } from '../../infrastructure/services/email.service';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  let tokenService: jest.Mocked<ITokenService>;
  let emailService: jest.Mocked<IEmailService>;

  const mockUser = new AuthUser({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
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
      findByEmail: jest.fn(),
    };

    const mockTokenService: Partial<jest.Mocked<ITokenService>> = {
      generatePasswordResetToken: jest.fn(),
    };

    const mockEmailService: Partial<jest.Mocked<IEmailService>> = {
      sendPasswordResetEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForgotPasswordUseCase,
        {
          provide: IUserAuthRepository,
          useValue: mockUserRepo,
        },
        {
          provide: ITokenService,
          useValue: mockTokenService,
        },
        {
          provide: IEmailService,
          useValue: mockEmailService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();
    useCase = module.get<ForgotPasswordUseCase>(ForgotPasswordUseCase);
    userRepo = module.get(IUserAuthRepository);
    tokenService = module.get(ITokenService);
    emailService = module.get(IEmailService);
    eventEmitter = module.get(EventEmitter2);
  });
  const mockEventEmitter: Partial<jest.Mocked<EventEmitter2>> = {
    emit: jest.fn(),
    emitAsync: jest.fn(),
  };
  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const email = 'test@example.com';

    beforeEach(() => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      delete process.env.FRONTEND_PASSWORD_RESET_URL;
    });

    it('should send password reset email when user exists', async () => {
      const resetToken = 'reset-token-123';

      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken.mockReturnValue(resetToken);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(tokenService.generatePasswordResetToken).toHaveBeenCalledWith({
        sub: 'user-123',
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        resetLink: `http://localhost:3000/reset-password?token=${resetToken}`,
      });
    });

    it('should not send email when user does not exist', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await useCase.execute(email);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(tokenService.generatePasswordResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return silently when user not found (security best practice)', async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      const result = await useCase.execute(email);

      expect(result).toBeUndefined();
    });

    it('should generate token with correct payload', async () => {
      const userId = 'specific-user-id';
      const userWithId = new AuthUser({
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
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

      userRepo.findByEmail.mockResolvedValue(userWithId);
      tokenService.generatePasswordResetToken.mockReturnValue('token');
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);

      expect(tokenService.generatePasswordResetToken).toHaveBeenCalledWith({
        sub: userId,
      });
    });

    it('should construct reset link with correct format', async () => {
      const resetToken = 'my-reset-token-xyz';
      const frontendUrl = 'https://example.com';
      process.env.FRONTEND_URL = frontendUrl;

      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken.mockReturnValue(resetToken);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: email,
        resetLink: `${frontendUrl}/reset-password?token=${resetToken}`,
      });
    });

    it('should use user email from entity, not input parameter', async () => {
      const inputEmail = 'test@example.com';
      const userEmail = 'actual@example.com';

      const userWithDifferentEmail = new AuthUser({
        id: 'user-123',
        email: userEmail,
        passwordHash: 'hashedPassword',
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

      userRepo.findByEmail.mockResolvedValue(userWithDifferentEmail);
      tokenService.generatePasswordResetToken.mockReturnValue('token');
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(inputEmail);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: userEmail,
        resetLink: expect.any(String),
      });
    });

    it('should handle multiple reset requests for same user', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken
        .mockReturnValueOnce('token1')
        .mockReturnValueOnce('token2');
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);
      await useCase.execute(email);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(2);
      expect(emailService.sendPasswordResetEmail).toHaveBeenNthCalledWith(1, {
        to: email,
        resetLink: 'http://localhost:3000/reset-password?token=token1',
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenNthCalledWith(2, {
        to: email,
        resetLink: 'http://localhost:3000/reset-password?token=token2',
      });
    });

    it('should complete successfully without throwing errors', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken.mockReturnValue('token');
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await expect(useCase.execute(email)).resolves.not.toThrow();
    });

    it('should use explicit FRONTEND_PASSWORD_RESET_URL when configured', async () => {
      const resetToken = 'mobile-token';
      process.env.FRONTEND_PASSWORD_RESET_URL = 'frontendmobile://reset-password';

      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken.mockReturnValue(resetToken);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: email,
        resetLink: `frontendmobile://reset-password?token=${resetToken}`,
      });
    });

    it('should append token with ampersand when explicit reset URL already has query params', async () => {
      const resetToken = 'query-token';
      process.env.FRONTEND_PASSWORD_RESET_URL = 'https://example.com/reset-password?source=email';

      userRepo.findByEmail.mockResolvedValue(mockUser);
      tokenService.generatePasswordResetToken.mockReturnValue(resetToken);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await useCase.execute(email);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: email,
        resetLink: `https://example.com/reset-password?source=email&token=${resetToken}`,
      });
    });
  });
});
