import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { UserPreferencesRepository } from 'src/modules/user/infrastructure/repositories/user-preferences.repository';
import { RegisterRequestDto } from '../dto/register-request.dto';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { Role } from '../../domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

const BASE_USER = {
  id: 'user-id',
  email: 'test@example.com',
  passwordHash: 'hashedPassword',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+33123456789',
  role_key: Role.USER_FREEMIUM,
  status: UserStatus.ACTIVE,
  failedLoginCount: 0,
  emailVerified: false,
  mfaEnabled: false,
  createdAt: new Date(),
};

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
        { provide: IUserAuthRepository, useValue: mockUserRepo },
        { provide: IPasswordService, useValue: mockPasswordService },
        { provide: UserPreferencesRepository, useValue: mockPreferencesRepo },
      ],
    }).compile();

    useCase = module.get(RegisterUserUseCase);
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
      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const savedUser = new AuthUser({
        ...BASE_USER,
        id: 'user-new-123',
        email: registerDto.email,
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(registerDto);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(passwordService.hash).toHaveBeenCalledWith(registerDto.password);
      expect(userRepo.save).toHaveBeenCalled();
      expect(preferencesRepo.createDefaultPreferences).toHaveBeenCalledWith('user-new-123');
      expect(result).toBe(savedUser);
    });

    it('should throw error when email already exists', async () => {
      userRepo.findByEmail.mockResolvedValue(new AuthUser({ ...BASE_USER }));

      await expect(useCase.execute(registerDto)).rejects.toThrow('Email already used');

      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should handle minimal information', async () => {
      const minimalDto: RegisterRequestDto = {
        email: 'minimal@example.com',
        password: 'password123',
      };

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const savedUser = new AuthUser({
        ...BASE_USER,
        id: 'user-minimal',
        email: minimalDto.email,
        firstName: '',
        lastName: '',
        phone: '',
      });

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
        ...BASE_USER,
        id: 'user-role',
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(registerDto);

      expect(result.getRoleKey()).toBe(Role.USER_FREEMIUM);
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'MySecurePassword123';

      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('superHashedVersion');

      const savedUser = new AuthUser({
        ...BASE_USER,
        passwordHash: 'superHashedVersion',
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...registerDto,
        password: plainPassword,
      });

      expect(passwordService.hash).toHaveBeenCalledWith(plainPassword);
      expect(result.getPasswordHash()).toBe('superHashedVersion');
    });

    it('should use empty strings when fields are undefined', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const dto: RegisterRequestDto = {
        email: 'empty@example.com',
        password: 'password',
        firstName: undefined as any,
        lastName: undefined as any,
        phone: undefined as any,
      };

      const savedUser = new AuthUser({
        ...BASE_USER,
        id: 'user-empty',
        email: dto.email,
        firstName: '',
        lastName: '',
        phone: '',
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(dto);

      expect(result.getFirstName()).toBe('');
      expect(result.getLastName()).toBe('');
      expect(result.getPhone()).toBe('');
    });

    it('should preserve provided fields', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashedPassword');

      const dto: RegisterRequestDto = {
        email: 'provided@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+33123456789',
      };

      const savedUser = new AuthUser({
        ...BASE_USER,
        id: 'user-provided',
        email: dto.email,
      });

      userRepo.save.mockResolvedValue(savedUser);
      preferencesRepo.createDefaultPreferences.mockResolvedValue(undefined);

      const result = await useCase.execute(dto);

      expect(result.getFirstName()).toBe('Jane');
      expect(result.getLastName()).toBe('Smith');
      expect(result.getPhone()).toBe('+33123456789');
    });
  });
});