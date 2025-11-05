import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { IUserRepository } from '../domain/user.repository.interface';
import { USER_REPOSITORY } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserStatus } from '../domain/user-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(createUserDto.email);
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Generate a unique ID (in production, use UUID)
    const id = Date.now().toString();

    // Create user entity
    const user = User.create({
      id,
      email: createUserDto.email,
      role: createUserDto.roleId ?? 'free',
      passwordHash: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    });

    return this.userRepository.save(user);
  }

  async findAll(query: QueryUserDto): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    return this.userRepository.findAll({
      ...filters,
      skip,
      take: limit,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: string, _updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // TODO: Implement update methods in User entity or update directly
    // For now, we need to recreate the user with updated values
    // This is a simplified implementation

    return this.userRepository.save(user);
  }

  async verifyEmail(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.verifyEmail();
    return this.userRepository.save(user);
  }

  async ban(id: string, reason?: string): Promise<User> {
    const user = await this.findOne(id);
    user.ban(reason);
    return this.userRepository.save(user);
  }

  async unban(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.unban();
    return this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.deactivate();
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.activate();
    return this.userRepository.save(user);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.findOne(id);

    // Verify current password
    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      throw new BadRequestException('User has no password set');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.updatePassword(hashedPassword);

    return this.userRepository.save(user);
  }

  async resetFailedLoginCount(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.resetFailedLoginCount();
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.delete(user.getId());
  }

  async count(_filters?: { status?: UserStatus; roleId?: string }): Promise<number> {
    // TODO: Implement proper filters in repository
    return this.userRepository.count();
  }
}
