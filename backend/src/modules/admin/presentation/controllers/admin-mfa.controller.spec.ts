import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AdminMfaController } from './admin-mfa.controller';
import { UserMfaTypeOrmRepository } from '../../infrastructure/database/repositories/user-mfa-typeorm.repository';
import { TotpService } from '../../infrastructure/services/totp.service';
import { ITokenService } from 'src/modules/auth/domain/services/token.service';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { UserThrottlerGuard } from '../guards/user-throttler.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockUserMfaRepo = {
  findByIdForMfa: jest.fn(),
  setSecret: jest.fn(),
  ensureEncryptedSecret: jest.fn(),
  getDecryptedSecret: jest.fn(),
  enable: jest.fn(),
  incrementFailedLogin: jest.fn(),
  resetFailedLogin: jest.fn(),
};

const mockTotp = {
  generateSecret: jest.fn(),
  buildOtpAuthUrl: jest.fn(),
  verify: jest.fn(),
};

const mockTokenService = {
  generateAccessToken: jest.fn(),
};

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

const makeReq = (overrides: any = {}) => ({
  user: {
    id: 'user-1',
    role: Role.USER_ADMIN,
    mfaEnabled: false,
    mfaVerified: false,
    ...overrides,
  },
});

describe('AdminMfaController', () => {
  let controller: AdminMfaController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMfaController],
      providers: [
        { provide: UserMfaTypeOrmRepository, useValue: mockUserMfaRepo },
        { provide: TotpService, useValue: mockTotp },
        { provide: ITokenService, useValue: mockTokenService },
      ],
    })
      .overrideGuard(AdminRolesGuard)
      .useValue(alwaysAllow)
      .overrideGuard(UserThrottlerGuard)
      .useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminMfaController);
  });

  describe('throttleTest()', () => {
    it('returns ok:true', () => {
      const result = controller.throttleTest();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('setup()', () => {
    it('returns otpauthUrl and qrCodeDataUrl for a user without MFA', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        mfaEnabled: false,
      });
      mockTotp.generateSecret.mockReturnValue('MYSECRET');
      mockTotp.buildOtpAuthUrl.mockReturnValue('otpauth://totp/...');
      mockUserMfaRepo.setSecret.mockResolvedValue(undefined);

      const result = await controller.setup(makeReq() as any);

      expect(mockTotp.generateSecret).toHaveBeenCalled();
      expect(mockUserMfaRepo.setSecret).toHaveBeenCalledWith('user-1', 'MYSECRET');
      expect(result).toMatchObject({ otpauthUrl: 'otpauth://totp/...' });
      expect(result.qrCodeDataUrl).toContain('data:image/png');
    });

    it('throws ForbiddenException when user is not found', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue(null);

      await expect(controller.setup(makeReq() as any)).rejects.toThrow(ForbiddenException);
      expect(mockTotp.generateSecret).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when MFA is already enabled', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        mfaEnabled: true,
      });

      await expect(controller.setup(makeReq() as any)).rejects.toThrow(ForbiddenException);
      expect(mockUserMfaRepo.setSecret).not.toHaveBeenCalled();
    });
  });

  describe('enable()', () => {
    it('enables MFA and returns access token on valid code', async () => {
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue('MYSECRET');
      mockTotp.verify.mockReturnValue(true);
      mockUserMfaRepo.enable.mockResolvedValue(undefined);
      mockTokenService.generateAccessToken.mockReturnValue('access-token-123');
      mockUserMfaRepo.resetFailedLogin.mockResolvedValue(undefined);

      const result = await controller.enable(makeReq() as any, { code: '123456' });

      expect(mockUserMfaRepo.enable).toHaveBeenCalledWith('user-1');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ mfaEnabled: true, mfaVerified: true }),
      );
      expect(result).toEqual({ accessToken: 'access-token-123' });
    });

    it('throws ForbiddenException when secret is not set', async () => {
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue(null);

      await expect(controller.enable(makeReq() as any, { code: '123456' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserMfaRepo.enable).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when TOTP code is invalid', async () => {
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue('MYSECRET');
      mockTotp.verify.mockReturnValue(false);

      await expect(controller.enable(makeReq() as any, { code: 'wrong' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserMfaRepo.enable).not.toHaveBeenCalled();
    });
  });

  describe('verify()', () => {
    it('verifies MFA and returns access token on valid code', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({ id: 'user-1', mfaEnabled: true });
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue('MYSECRET');
      mockTotp.verify.mockReturnValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('new-token');
      mockUserMfaRepo.resetFailedLogin.mockResolvedValue(undefined);

      const result = await controller.verify(makeReq() as any, { code: '654321' });

      expect(result).toEqual({ accessToken: 'new-token' });
      expect(mockUserMfaRepo.resetFailedLogin).toHaveBeenCalledWith('user-1');
    });

    it('throws ForbiddenException when MFA is not enabled', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({ id: 'user-1', mfaEnabled: false });

      await expect(controller.verify(makeReq() as any, { code: '123456' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when user not found', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue(null);

      await expect(controller.verify(makeReq() as any, { code: '123456' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when secret is missing', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({ id: 'user-1', mfaEnabled: true });
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue(null);

      await expect(controller.verify(makeReq() as any, { code: '123456' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException and increments failed count on wrong code', async () => {
      mockUserMfaRepo.findByIdForMfa.mockResolvedValue({ id: 'user-1', mfaEnabled: true });
      mockUserMfaRepo.ensureEncryptedSecret.mockResolvedValue(undefined);
      mockUserMfaRepo.getDecryptedSecret.mockResolvedValue('MYSECRET');
      mockTotp.verify.mockReturnValue(false);
      mockUserMfaRepo.incrementFailedLogin.mockResolvedValue(undefined);

      await expect(controller.verify(makeReq() as any, { code: 'bad' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserMfaRepo.incrementFailedLogin).toHaveBeenCalledWith('user-1');
    });
  });
});
