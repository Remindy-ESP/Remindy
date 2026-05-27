import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminUsersQueryDto } from './admin-users-query.dto';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

describe('AdminUsersQueryDto', () => {
  it('transforms boolean and numeric values', () => {
    const dto = plainToInstance(AdminUsersQueryDto, {
      emailVerified: 'true',
      mfaEnabled: true,
      page: '2',
      limit: '10',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.emailVerified).toBe(true);
    expect(dto.mfaEnabled).toBe(true);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('supports false boolean values and valid enum filters', () => {
    const dto = plainToInstance(AdminUsersQueryDto, {
      role: Role.USER_ADMIN,
      status: UserStatus.BANNED,
      emailVerified: 'false',
      mfaEnabled: 'false',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.role).toBe(Role.USER_ADMIN);
    expect(dto.status).toBe(UserStatus.BANNED);
    expect(dto.emailVerified).toBe(false);
    expect(dto.mfaEnabled).toBe(false);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(25);
    expect(dto.sortBy).toBe('createdAt');
    expect(dto.sortDir).toBe('DESC');
  });

  it('rejects invalid sort and number values', () => {
    const dto = plainToInstance(AdminUsersQueryDto, {
      page: '0',
      limit: '500',
      sortBy: 'x',
      sortDir: 'UP',
    });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['page', 'limit', 'sortBy', 'sortDir']));
  });
});
