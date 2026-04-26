import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './presentation/controllers/seed.controller';
import { SeedService } from './application/services/seed.service';
import { RoleEntity } from 'src/infrastructure/database/entities/role.entity';
import { ContractEntity } from 'src/infrastructure/database/entities/contract.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { UserPreferenceEntity } from 'src/infrastructure/database/entities/user-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, ContractEntity, EUser, UserPreferenceEntity])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
