import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
  let factory: (data: string | undefined, ctx: any) => unknown;

  const mockCreateParamDecorator = jest.fn((fn) => {
    factory = fn;
    return fn;
  });

  beforeAll(() => {
    jest.resetModules();

    jest.doMock('@nestjs/common', () => {
      const actual = jest.requireActual('@nestjs/common');
      return {
        ...actual,
        createParamDecorator: mockCreateParamDecorator,
      };
    });

    require('./current-user.decorator');
  });

  afterAll(() => {
    jest.dontMock('@nestjs/common');
    jest.resetModules();
  });

  const mockContext = (user?: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as any;

  it('returns null when request has no user', () => {
    const result = factory(undefined, mockContext(undefined));
    expect(result).toBeNull();
  });

  it('returns the full user when no field is requested', () => {
    const user = { id: 'user-1', email: 'john@example.com', role: 'USER' };

    const result = factory(undefined, mockContext(user));

    expect(result).toBe(user);
  });

  it('returns a specific field when requested', () => {
    const user = { id: 'user-1', email: 'john@example.com', role: 'USER' };

    const result = factory('id', mockContext(user));

    expect(result).toBe('user-1');
  });

  it('returns undefined when requested field does not exist', () => {
    const user = { id: 'user-1', email: 'john@example.com' };

    const result = factory('missing', mockContext(user));

    expect(result).toBeUndefined();
  });
});