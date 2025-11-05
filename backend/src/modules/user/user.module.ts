import { Module } from '@nestjs/common';
<<<<<<< Updated upstream
import { EUser } from '../../infrastructure/database/entities/user.entity';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EUser])],
  providers: [],
  controllers: [UserController],
=======
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { UserMapper } from './infrastructure/user.mapper';
import { UserRepository } from './infrastructure/user.repository';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { UserController } from './application/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [
    UserMapper,
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [USER_REPOSITORY, UserMapper, UserService],
>>>>>>> Stashed changes
})
export class UserModule {}
