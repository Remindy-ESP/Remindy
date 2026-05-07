import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser, AuthenticatedUser } from './current-user.decorator';

/**
 * Helper to invoke a param decorator manually, simulating NestJS DI infrastructure.
 * createParamDecorator wraps the factory under ROUTE_ARGS_METADATA; we extract and
 * call the factory directly so we can control the ExecutionContext.
 */
function getParamDecoratorFactory(decorator: (...args: any[]) => ParameterDecorator) {
  // Apply the decorator to a dummy class/method to register metadata
  class Dummy {
    method(@decorator() _arg: any) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Dummy, 'method');

  // The metadata object has keys of the form `<type>:<index>`; grab the first
  const factory = args[Object.keys(args)[0]].factory;
  return factory;
}

describe('CurrentUser decorator', () => {
  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  };

  it('should return the full user object when no data key is specified', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'USER_FREEMIUM',
    };
    const ctx = createMockContext(mockUser);
    const factory = getParamDecoratorFactory(CurrentUser);

    const result = factory(undefined, ctx);

    expect(result).toBe(mockUser);
  });

  it('should return a specific field when a data key is provided', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-456',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    const ctx = createMockContext(mockUser);
    const factory = getParamDecoratorFactory(CurrentUser);

    const resultId = factory('id', ctx);
    const resultEmail = factory('email', ctx);
    const resultRole = factory('role', ctx);

    expect(resultId).toBe('user-456');
    expect(resultEmail).toBe('admin@example.com');
    expect(resultRole).toBe('ADMIN');
  });

  it('should return null when user is undefined on the request', () => {
    const ctx = createMockContext(undefined);
    const factory = getParamDecoratorFactory(CurrentUser);

    const result = factory(undefined, ctx);

    expect(result).toBeNull();
  });

  it('should return null when user is null on the request', () => {
    const ctx = createMockContext(null);
    const factory = getParamDecoratorFactory(CurrentUser);

    const result = factory(undefined, ctx);

    expect(result).toBeNull();
  });

  it('should return null when user is missing and a data key is requested', () => {
    const ctx = createMockContext(undefined);
    const factory = getParamDecoratorFactory(CurrentUser);

    const result = factory('id', ctx);

    expect(result).toBeNull();
  });

  it('should return undefined for a key that does not exist on the user', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-789',
      email: 'user@example.com',
      role: 'USER_PREMIUM',
    };
    const ctx = createMockContext(mockUser);
    const factory = getParamDecoratorFactory(CurrentUser);

    const result = factory('nonExistentField', ctx);

    expect(result).toBeUndefined();
  });

  it('should return extra dynamic fields from the user object', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-999',
      email: 'power@example.com',
      role: 'USER_PREMIUM',
      mfaEnabled: true,
      sessionId: 'sess-abc',
    };
    const ctx = createMockContext(mockUser);
    const factory = getParamDecoratorFactory(CurrentUser);

    expect(factory('mfaEnabled', ctx)).toBe(true);
    expect(factory('sessionId', ctx)).toBe('sess-abc');
  });

  it('should return the entire user when data is an empty string', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-111',
      email: 'full@example.com',
      role: 'USER_FREEMIUM',
    };
    const ctx = createMockContext(mockUser);
    const factory = getParamDecoratorFactory(CurrentUser);

    // Empty string is falsy, so the guard `if (data)` falls through → returns full user
    const result = factory('', ctx);

    expect(result).toBe(mockUser);
  });
});
