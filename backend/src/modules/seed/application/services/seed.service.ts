import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from 'src/infrastructure/database/entities/role.entity';
import { ContractEntity } from 'src/infrastructure/database/entities/contract.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import {
  UserPreferenceEntity,
  Theme,
} from 'src/infrastructure/database/entities/user-preference.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepository: Repository<ContractEntity>,
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
    @InjectRepository(UserPreferenceEntity)
    private readonly userPreferenceRepository: Repository<UserPreferenceEntity>,
  ) {}

  async seedAll(): Promise<{ message: string; details: any }> {
    this.logger.log('Starting database seeding...');

    const rolesCreated = await this.seedRoles();
    const contractsCreated = await this.seedContracts();
    const usersCreated = await this.seedUsers();

    this.logger.log('Database seeding completed!');

    return {
      message: 'Database seeding completed successfully',
      details: {
        roles: rolesCreated,
        contracts: contractsCreated,
        users: usersCreated,
      },
    };
  }

  private async seedRoles(): Promise<string[]> {
    this.logger.log('Seeding roles...');
    const createdRoles: string[] = [];

    const roles = [
      {
        key: Role.USER_FREEMIUM,
        label: 'Utilisateur Freemium',
        description: 'Utilisateur avec accès gratuit limité',
      },
      {
        key: Role.USER_PREMIUM,
        label: 'Utilisateur Premium',
        description: 'Utilisateur avec accès premium complet',
      },
      {
        key: Role.USER_ADMIN,
        label: 'Administrateur',
        description: "Administrateur de l'application",
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { key: roleData.key },
      });

      if (!existingRole) {
        await this.roleRepository.save(roleData);
        createdRoles.push(roleData.key);
        this.logger.log(`Role created: ${roleData.key}`);
      } else {
        this.logger.log(`Role already exists: ${roleData.key}`);
      }
    }

    return createdRoles;
  }

  private async seedContracts(): Promise<string[]> {
    this.logger.log('Seeding contracts...');
    const createdContracts: string[] = [];

    const contracts = [
      {
        type: 'netflix',
        label: 'Netflix',
        icon: 'video',
        color: '#E50914',
        description: 'Service de streaming vidéo',
      },
      {
        type: 'spotify',
        label: 'Spotify',
        icon: 'music',
        color: '#1DB954',
        description: 'Service de streaming musical',
      },
      {
        type: 'amazon_prime',
        label: 'Amazon Prime',
        icon: 'package',
        color: '#FF9900',
        description: 'Service de livraison et streaming Amazon',
      },
      {
        type: 'disney_plus',
        label: 'Disney+',
        icon: 'video',
        color: '#113CCF',
        description: 'Service de streaming Disney',
      },
      {
        type: 'apple_music',
        label: 'Apple Music',
        icon: 'music',
        color: '#FA243C',
        description: 'Service de streaming musical Apple',
      },
    ];

    for (const contractData of contracts) {
      const existingContract = await this.contractRepository.findOne({
        where: { type: contractData.type },
      });

      if (!existingContract) {
        await this.contractRepository.save(contractData);
        createdContracts.push(contractData.type);
        this.logger.log(`Contract created: ${contractData.type}`);
      } else {
        this.logger.log(`Contract already exists: ${contractData.type}`);
      }
    }

    return createdContracts;
  }

  private async seedUsers(): Promise<string[]> {
    this.logger.log('Seeding users...');
    const createdUsers: string[] = [];

    const users = [
      {
        email: 'sophie.martin@example.com',
        password: 'Sophie2024!',
        firstName: 'Sophie',
        lastName: 'Martin',
        phone: '+33612345678',
        role_key: Role.USER_FREEMIUM,
        status: UserStatus.ACTIVE,
        timezone: 'Europe/Paris',
        language: 'fr',
        emailVerified: true,
        preferences: {
          theme: Theme.LIGHT,
          notificationEmail: true,
          notificationPush: true,
          notificationSms: false,
          defaultReminderDelay: 3,
          showOnlineStatus: true,
        },
      },
      {
        email: 'pierre.dubois@example.com',
        password: 'Pierre2024!',
        firstName: 'Pierre',
        lastName: 'Dubois',
        phone: '+33623456789',
        role_key: Role.USER_PREMIUM,
        status: UserStatus.ACTIVE,
        timezone: 'Europe/Paris',
        language: 'fr',
        emailVerified: true,
        preferences: {
          theme: Theme.DARK,
          notificationEmail: true,
          notificationPush: true,
          notificationSms: true,
          defaultReminderDelay: 7,
          showOnlineStatus: false,
        },
      },
      {
        email: 'marie.lambert@example.com',
        password: 'Marie2024!',
        firstName: 'Marie',
        lastName: 'Lambert',
        phone: '+33634567890',
        role_key: Role.USER_ADMIN,
        status: UserStatus.ACTIVE,
        timezone: 'Europe/Paris',
        language: 'fr',
        emailVerified: true,
        preferences: {
          theme: Theme.AUTO,
          notificationEmail: true,
          notificationPush: false,
          notificationSms: false,
          defaultReminderDelay: 5,
          showOnlineStatus: true,
        },
      },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const { password, preferences, ...userDataWithoutPassword } = userData;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await this.userRepository.save({
          ...userDataWithoutPassword,
          passwordHash,
        });

        // Create user preferences
        await this.userPreferenceRepository.save({
          userId: user.id,
          ...preferences,
        });

        createdUsers.push(userData.email);
        this.logger.log(`User created: ${userData.email} (password: ${password})`);
      } else {
        this.logger.log(`User already exists: ${userData.email}`);
      }
    }

    return createdUsers;
  }
}
