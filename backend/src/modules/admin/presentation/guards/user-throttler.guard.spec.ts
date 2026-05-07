import { UserThrottlerGuard } from './user-throttler.guard';

// Stub ThrottlerGuard so we only test our override
jest.mock('@nestjs/throttler', () => {
  class ThrottlerGuard {
    protected getTracker(_req: any): Promise<string> {
      return Promise.resolve('default');
    }
    canActivate() {
      return true;
    }
  }
  return { ThrottlerGuard };
});

describe('UserThrottlerGuard.getTracker()', () => {
  let guard: UserThrottlerGuard;

  beforeEach(() => {
    guard = new UserThrottlerGuard({} as any, {} as any, {} as any);
  });

  it('returns user-prefixed id when user.id is present', async () => {
    const req = { user: { id: 'user-abc' } } as any;
    const result = await (guard as any).getTracker(req);
    expect(result).toBe('user:user-abc');
  });

  it('falls back to req.ip when user.id is missing', async () => {
    const req = { user: {}, ip: '192.168.1.1' } as any;
    const result = await (guard as any).getTracker(req);
    expect(result).toBe('192.168.1.1');
  });

  it('falls back to ip:unknown when user is undefined and ip is undefined', async () => {
    const req = { user: undefined, ip: undefined } as any;
    const result = await (guard as any).getTracker(req);
    expect(result).toBe('ip:unknown');
  });

  it('falls back to ip:unknown when user has no id and ip is undefined', async () => {
    const req = { user: {}, ip: undefined } as any;
    const result = await (guard as any).getTracker(req);
    expect(result).toBe('ip:unknown');
  });

  it('uses ip over ip:unknown when user.id missing but ip is present', async () => {
    const req = { user: undefined, ip: '10.0.0.1' } as any;
    const result = await (guard as any).getTracker(req);
    expect(result).toBe('10.0.0.1');
  });
});
