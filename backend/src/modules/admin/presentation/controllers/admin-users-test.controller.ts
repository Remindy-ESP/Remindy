import { Controller, Param, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { Admin } from '../decorators/admin.decorator';
import { assertCanActOnUser } from '../../domain/policies/admin-user.policy';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

@ApiExcludeController()
@Controller('admin/users-test')
export class AdminUsersTestController {
  constructor(
    @InjectRepository(EUser)
    private readonly users: Repository<EUser>,
  ) {}

  @Post(':id/suspend')
  @Admin()
  async suspend(@Req() req: any, @Param('id') id: string) {
    const actorRole = req.user.role as Role;

    const target = await this.users.findOne({
      where: { id },
      select: ['id', 'role_key'],
    });

    const targetRole = target?.role_key as Role;

    assertCanActOnUser({
      actorRole,
      targetRole,
      action: 'suspend',
    });

    return { ok: true, targetId: id, targetRole };
  }
}
