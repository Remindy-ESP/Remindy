import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { UserPreferencesRepository } from 'src/modules/user/infrastructure/repositories/user-preferences.repository';
import { RegisterRequestDto } from '../dto/register-request.dto';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepo: jest.Mocked<IUserAuthRepository>;
  let passwordService: jest.Mocked<IPasswordService>;
  let preferencesRepo: jest.Mocked<UserPreferencesRepository>;

  beforeEach(async () => {
    const mockUserRepo: Partial<jest.Mocked<IUserAuthRepository>> = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    const mockPasswordService: Partial<jest.Mocked<IPasswordService>> = {
      hash: jest.fn(),
    };

    const mockPreferencesRepo: Partial<jest.Mocked<UserPreferencesRepository>> = {
      createDefaultPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: IUserAuthRepository,
          useValue: mockUserRepo,
        },
        {
          provide: IPasswordService,
          useValue: mockPasswordService,
        },
        {
          provide: UserPreferencesRepository,
          useValue: mockPreferencesRepo,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    userRepo = module.get(IUserAuthRepository);
    passwordService = module.get(IPasswordService);
    preferencesRepo = module.get(UserPreferencesRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const registerDto: RegisterRequestDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567890',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = new AuthUser({
        id: 'user-new-123',
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue(hashedPassword);
      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(registerDto);

      expect(result).toBe(savedUser);
      expect(userRepo.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(passwordService.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepo.save).toHaveBeenCalled();
      expect(preferencesRepo.createDefaultPreferences).toHaveBeenCalledWith('user-new-123');
    });

    it('should throw error when email already exists', async () => {
      const existingUser = new AuthUser({
        id: 'existing-user',
        email: registerDto.email,
        passwordHash: 'someHash',
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(existingUser);

      await expect(useCase.execute(registerDto)).rejects.toThrow('Email already used');
      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should handle registration with minimal information', async () => {
      const minimalDto: RegisterRequestDto = {
        email: 'minimal@example.com',
        password: 'password123',
      };

      const savedUser = new AuthUser({
        id: 'user-minimal',
        email: minimalDto.email,
        passwordHash: 'hashedPassword',
        firstName: '',
        lastName: '',
        phone: '',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');
      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(minimalDto);

      expect(result.getFirstName()).toBe('');
      expect(result.getLastName()).toBe('');
      expect(result.getPhone()).toBe('');
    });

    it('should assign USER_FREEMIUM role by default', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const savedUser = new AuthUser({
        id: 'user-new-id',
        email: registerDto.email,
        passwordHash: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(registerDto);

      expect(result.getRoleKey()).toBe(Role.USER_FREEMIUM);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'MySecurePassword123';
      const hashedPassword = 'superHashedVersion';

      const dtoWithPlainPassword = { ...registerDto, password: plainPassword };

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue(hashedPassword);

      const savedUser = new AuthUser({
        id: 'user-new-id',
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(dtoWithPlainPassword);

      expect(passwordService.hash).toHaveBeenCalledWith(plainPassword);
      expect(result.getPasswordHash()).toBe(hashedPassword);
      expect(result.getPasswordHash()).not.toBe(plainPassword);
    });

    it('should create default preferences after user creation', async () => {
      const userId = 'new-user-456';
      const savedUser = new AuthUser({
        id: userId,
        email: registerDto.email,
        passwordHash: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');
      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      await useCase.execute(registerDto);

      expect(preferencesRepo.createDefaultPreferences).toHaveBeenCalledWith(userId);
      expect(preferencesRepo.createDefaultPreferences).toHaveBeenCalledTimes(1);
    });

    it('should preserve all user data fields', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const savedUser = new AuthUser({
        id: 'user-new-id',
        email: registerDto.email,
        passwordHash: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        failedLoginCount: 0,
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(registerDto);

      expect(result.getEmail()).toBe(registerDto.email);
      expect(result.getFirstName()).toBe(registerDto.firstName);
      expect(result.getLastName()).toBe(registerDto.lastName);
      expect(result.getPhone()).toBe(registerDto.phone);
    });
  });
});
