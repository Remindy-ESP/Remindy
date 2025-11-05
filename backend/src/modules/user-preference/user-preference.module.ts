import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferenceOrmEntity } from './infrastructure/user-preference.orm-entity';
import { UserPreferenceMapper } from './infrastructure/user-preference.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferenceOrmEntity])],
  providers: [UserPreferenceMapper],
  exports: [UserPreferenceMapper],
})
export class UserPreferenceModule {}
