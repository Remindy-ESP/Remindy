import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSessionOrmEntity } from './infrastructure/user-session.orm-entity';
import { UserSessionMapper } from './infrastructure/user-session.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([UserSessionOrmEntity])],
  providers: [UserSessionMapper],
  exports: [UserSessionMapper],
})
export class UserSessionModule {}
