import { Module } from '@nestjs/common';
import { SubscriptionController } from './presentation/controllers/subscription.controller';

@Module({
  providers: [],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
