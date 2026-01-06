import { Test, TestingModule } from '@nestjs/testing';
import { BcryptPasswordService } from './bcrypt-password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('BcryptPasswordService', () => {
  let service: BcryptPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptPasswordService],
    }).compile();

    service = module.get<BcryptPasswordService>(BcryptPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password with salt rounds of 12', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = '$2b$12$hashed_password_value';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('should hash different passwords to different hashes', async () => {
      const password1 = 'password1';
      const password2 = 'password2';
      const hash1 = '$2b$12$hash1';
      const hash2 = '$2b$12$hash2';

      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValueOnce(hash1 as never)
        .mockResolvedValueOnce(hash2 as never);

      const result1 = await service.hash(password1);
      const result2 = await service.hash(password2);

      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
      expect(result1).not.toBe(result2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = '$2b$12$empty_hash';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith('', 12);
    });

    it('should handle long password', async () => {
      const password = 'a'.repeat(1000);
      const hashedPassword = '$2b$12$long_hash';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should handle password with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = '$2b$12$special_hash';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should propagate bcrypt errors', async () => {
      const password = 'myPassword';
      const error = new Error('Bcrypt hashing failed');

      jest.spyOn(bcrypt, 'hash').mockRejectedValue(error);

      await expect(service.hash(password)).rejects.toThrow('Bcrypt hashing failed');
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'mySecurePassword123';
      const hash = '$2b$12$hashed_password_value';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'wrongPassword';
      const hash = '$2b$12$hashed_password_value';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false when comparing empty password', async () => {
      const password = '';
      const hash = '$2b$12$hashed_password_value';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('', hash);
    });

    it('should handle comparison with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = '$2b$12$special_hash';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.compare(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for invalid hash format', async () => {
      const password = 'myPassword';
      const invalidHash = 'not_a_valid_hash';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.compare(password, invalidHash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, invalidHash);
    });

    it('should propagate bcrypt compare errors', async () => {
      const password = 'myPassword';
      const hash = '$2b$12$hash';
      const error = new Error('Bcrypt compare failed');

      jest.spyOn(bcrypt, 'compare').mockRejectedValue(error);

      await expect(service.compare(password, hash)).rejects.toThrow('Bcrypt compare failed');
    });

    it('should handle multiple comparisons correctly', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = '$2b$12$hashed_password_value';

      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);

      const result1 = await service.compare(password, hash);
      const result2 = await service.compare(wrongPassword, hash);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration behavior', () => {
    it('should implement IPasswordService interface', () => {
      expect(service.hash).toBeDefined();
      expect(service.compare).toBeDefined();
      expect(typeof service.hash).toBe('function');
      expect(typeof service.compare).toBe('function');
    });
  });
});
