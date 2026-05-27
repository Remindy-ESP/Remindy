import { LoginResponseDto } from './login-response.dto';

describe('LoginResponseDto', () => {
  it('should be instantiable', () => {
    const dto = new LoginResponseDto();
    expect(dto).toBeDefined();
  });

  it('should allow setting and getting accessToken', () => {
    const dto = new LoginResponseDto();
    dto.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    expect(dto.accessToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  });

  it('should allow setting and getting refreshToken', () => {
    const dto = new LoginResponseDto();
    dto.refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh';
    expect(dto.refreshToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...refresh');
  });

  it('should allow setting and getting userId', () => {
    const dto = new LoginResponseDto();
    dto.userId = '123e4567-e89b-12d3-a456-426614174000';
    expect(dto.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should allow creating a complete response object', () => {
    const dto = new LoginResponseDto();
    dto.accessToken = 'access';
    dto.refreshToken = 'refresh';
    dto.userId = 'user-123';

    expect(dto).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'user-123',
    });
  });
});
