import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { RegisterUserDto } from '../dto/register-user.dto';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IPasswordService } from '../../domain/services/password.service';
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(dto: RegisterUserDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new Error('Email already used');

    const hash = await this.passwordService.hash(dto.password);

    const user = AuthUser.createNew({
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName || '',
        lastName: dto.lastName || '',
        phone: dto.phone || '',
        role: 'user_freemium',
    });


    return this.userRepo.save(user);
  }
}