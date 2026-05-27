import { RegisterUserResponseDto } from './register-response.dto';

describe('RegisterUserResponseDto', () => {
  it('should be instantiable', () => {
    const dto = new RegisterUserResponseDto();
    expect(dto).toBeDefined();
  });

  it('should allow setting and getting success', () => {
    const dto = new RegisterUserResponseDto();
    dto.success = true;
    expect(dto.success).toBe(true);
  });

  it('should allow setting and getting userId', () => {
    const dto = new RegisterUserResponseDto();
    dto.userId = 'user-456';
    expect(dto.userId).toBe('user-456');
  });

  it('should allow setting and getting accessToken', () => {
    const dto = new RegisterUserResponseDto();
    dto.accessToken = 'access-token-value';
    expect(dto.accessToken).toBe('access-token-value');
  });

  it('should allow setting and getting refreshToken', () => {
    const dto = new RegisterUserResponseDto();
    dto.refreshToken = 'refresh-token-value';
    expect(dto.refreshToken).toBe('refresh-token-value');
  });

  it('should allow creating a complete response object', () => {
    const dto = new RegisterUserResponseDto();
    dto.success = true;
    dto.userId = 'user-123';
    dto.accessToken = 'access';
    dto.refreshToken = 'refresh';

    expect(dto).toEqual({
      success: true,
      userId: 'user-123',
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });
});
