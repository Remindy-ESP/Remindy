import 'reflect-metadata';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles decorator', () => {
  it('stores roles metadata on a method', () => {
    class TestClass {
      @Roles('user_admin', 'super_admin')
      method() {}
    }

    expect(Reflect.getMetadata(ROLES_KEY, TestClass.prototype.method)).toEqual([
      'user_admin',
      'super_admin',
    ]);
  });
});
