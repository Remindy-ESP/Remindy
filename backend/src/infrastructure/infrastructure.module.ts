import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EUser } from './database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EUser])],
  providers: [],
  exports: [],
})
export class InfrastructureModule {}
