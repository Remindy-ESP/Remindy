import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { EUser } from '../../infrastructure/database/entities/user.entity';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EUser])],
  providers: [],
  controllers: [UserController],
})
export class UsersModule {}
