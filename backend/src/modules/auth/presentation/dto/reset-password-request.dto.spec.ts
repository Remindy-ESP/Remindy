import { ResetPasswordRequestDto } from './reset-password-request.dto';

describe('ResetPasswordRequestDto (presentation)', () => {
  it('can be instantiated with token and newPassword', () => {
    const dto = new ResetPasswordRequestDto();
    dto.token = 'reset-token';
    dto.newPassword = 'new-password-123';

    expect(dto.token).toBe('reset-token');
    expect(dto.newPassword).toBe('new-password-123');
  });
});
