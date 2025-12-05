import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { RegisterRequestDto } from '../dto/register-request.dto';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { UserPreferencesRepository } from 'src/modules/user/infrastructure/repositories/user-preferences.repository';
import { Role } from '../../domain/value-objects/role.enum';
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly passwordService: IPasswordService,
    private readonly preferencesRepo: UserPreferencesRepository,
  ) {}

  async execute(dto: RegisterRequestDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('Email already used');
    }

    const hash = await this.passwordService.hash(dto.password);

    const user = AuthUser.createNew({
      email: dto.email,
      passwordHash: hash,
      firstName: dto.firstName || '',
      lastName: dto.lastName || '',
      phone: dto.phone || '',
      role_key: Role.USER_FREEMIUM,
    });

    const savedUser = await this.userRepo.save(user);

    await this.preferencesRepo.createDefaultPreferences(savedUser.getId());

    return savedUser;
  }
}
