import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EUser } from './database/entities/user.entity';
import { ContractEntity } from './database/entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EUser, ContractEntity])],
  providers: [],
  exports: [],
})
export class InfrastructureModule {}
