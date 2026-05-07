import { Test, TestingModule } from '@nestjs/testing';
import { AdminCsrfController } from './admin-csrf.controller';
import { AdminRolesGuard } from '../guards/admin-roles.guard';

const alwaysAllow = { canActivate: () => true };

describe('AdminCsrfController', () => {
  let controller: AdminCsrfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCsrfController],
    })
      .overrideGuard(AdminRolesGuard).useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminCsrfController);
  });

  describe('csrf()', () => {
    it('sets csrfToken cookie and returns the token', () => {
      const mockRes = {
        cookie: jest.fn(),
      };

      const result = controller.csrf(mockRes as any);

      expect(typeof result.csrfToken).toBe('string');
      expect(result.csrfToken.length).toBe(64); // 32 bytes in hex = 64 chars
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'csrfToken',
        result.csrfToken,
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'lax',
        }),
      );
    });

    it('sets secure:false in non-production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const mockRes = { cookie: jest.fn() };
      controller.csrf(mockRes as any);

      const cookieArgs = mockRes.cookie.mock.calls[0][2];
      expect(cookieArgs.secure).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('sets secure:true in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRes = { cookie: jest.fn() };
      controller.csrf(mockRes as any);

      const cookieArgs = mockRes.cookie.mock.calls[0][2];
      expect(cookieArgs.secure).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('returns different tokens on each call (random)', () => {
      const mockRes = { cookie: jest.fn() };
      const result1 = controller.csrf(mockRes as any);
      const result2 = controller.csrf(mockRes as any);
      expect(result1.csrfToken).not.toBe(result2.csrfToken);
    });
  });

  describe('ping()', () => {
    it('returns ok:true', () => {
      const result = controller.ping();
      expect(result).toEqual({ ok: true });
    });
  });
});
