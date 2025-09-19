import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { EUser } from '../../infrastructure/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EUser])],
  providers: [],
  controllers: [],
})
export class UsersModule {}
