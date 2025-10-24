import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  providers: [],
  controllers: [AuthController],
})
export class AuthModule {}
