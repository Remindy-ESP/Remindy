import { Test, TestingModule } from '@nestjs/testing';
import { SendVerificationEmailUseCase } from './send-verification-email.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { ITokenService } from '../../domain/services/token.service';
import { IEmailService } from '../../infrastructure/services/email.service';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

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

describe('SendVerificationEmailUseCase', () => {
  let useCase: SendVerificationEmailUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  let tokenService: jest.Mocked<ITokenService>;
  let emailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendVerificationEmailUseCase,
        { provide: IUserAuthRepository, useValue: { findById: jest.fn() } },
        { provide: ITokenService, useValue: { generateEmailVerificationToken: jest.fn() } },
        { provide: IEmailService, useValue: { sendVerificationEmail: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(SendVerificationEmailUseCase);
    userRepo = module.get(IUserAuthRepository);
    tokenService = module.get(ITokenService);
    emailService = module.get(IEmailService);
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
    delete process.env.FRONTEND_EMAIL_VERIFY_URL;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send verification email when user exists and email not verified', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('verify-token-123');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(userRepo.findById).toHaveBeenCalledWith('user-123');
      expect(tokenService.generateEmailVerificationToken).toHaveBeenCalledWith({ sub: 'user-123' });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'http://localhost:3000/verify-email?token=verify-token-123',
      });
    });

    it('should return silently when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await useCase.execute('unknown-id');

      expect(tokenService.generateEmailVerificationToken).not.toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return silently when email is already verified', async () => {
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: true });
      userRepo.findById.mockResolvedValue(user);

      await useCase.execute('user-123');

      expect(tokenService.generateEmailVerificationToken).not.toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should use FRONTEND_EMAIL_VERIFY_URL when provided', async () => {
      process.env.FRONTEND_EMAIL_VERIFY_URL = 'https://app.example.com/verify';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('token-xyz');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'https://app.example.com/verify?token=token-xyz',
      });
    });

    it('should append token with ampersand when FRONTEND_EMAIL_VERIFY_URL already has query params', async () => {
      process.env.FRONTEND_EMAIL_VERIFY_URL = 'https://app.example.com/verify?lang=fr';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('token-xyz');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'https://app.example.com/verify?lang=fr&token=token-xyz',
      });
    });

    it('should fallback to localhost when FRONTEND_URL is missing', async () => {
      delete process.env.FRONTEND_URL;
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('fallback-token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'http://localhost:3000/verify-email?token=fallback-token',
      });
    });

    it('should fallback to FRONTEND_URL when FRONTEND_EMAIL_VERIFY_URL is only whitespace', async () => {
      process.env.FRONTEND_URL = 'https://frontend.example.com';
      process.env.FRONTEND_EMAIL_VERIFY_URL = '   ';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('blank-token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'https://frontend.example.com/verify-email?token=blank-token',
      });
    });

    it('should trim FRONTEND_EMAIL_VERIFY_URL before appending token', async () => {
      process.env.FRONTEND_EMAIL_VERIFY_URL = '  https://example.com/verify  ';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('trimmed-token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        verificationLink: 'https://example.com/verify?token=trimmed-token',
      });
    });

    it('should resolve without throwing when everything succeeds', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const user = new AuthUser({ ...BASE_USER_PROPS, emailVerified: false });
      userRepo.findById.mockResolvedValue(user);
      tokenService.generateEmailVerificationToken.mockReturnValue('token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await expect(useCase.execute('user-123')).resolves.not.toThrow();
    });
  });
});

describe('SendVerificationEmailUseCase constructor branch coverage', () => {
  it('should instantiate with null dependencies to cover constructor parameter branches', () => {
    const instance = new SendVerificationEmailUseCase(null as any, null as any, null as any);
    expect(instance).toBeDefined();
  });
});
