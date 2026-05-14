import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EUser } from '../../../../infrastructure/database/entities/user.entity';

export const EXPO_INSTANCE = Symbol('EXPO_INSTANCE');
export const EXPO_CLASS = Symbol('EXPO_CLASS');

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
    @Inject(EXPO_INSTANCE) private readonly expo: any,
    @Inject(EXPO_CLASS) private readonly ExpoClass: any,
  ) {}

  async registerToken(userId: string, token: string): Promise<void> {
    if (!this.ExpoClass.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token for user ${userId}: ${String(token)}`);
      throw new BadRequestException(`Invalid Expo push token: ${String(token)}`);
    }

    await this.userRepository.update(userId, { expoPushToken: token });
    this.logger.log(`Registered push token for user ${userId}`);
  }

  async unregisterToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      expoPushToken: null as any,
    });
    this.logger.log(`Unregistered push token for user ${userId}`);
  }

  async sendToUser(payload: PushNotificationPayload): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      select: ['id', 'expoPushToken'],
    });

    if (!user?.expoPushToken) {
      this.logger.debug(`No push token for user ${payload.userId}, skipping push`);
      return false;
    }

    if (!this.ExpoClass.isExpoPushToken(user.expoPushToken)) {
      this.logger.warn(`Invalid stored push token for user ${payload.userId}`);
      return false;
    }

    const message = {
      to: user.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

        for (const ticket of ticketChunk) {
          if (ticket.status === 'error') {
            this.logger.error(
              `Push notification error for user ${payload.userId}: ${ticket.message}`,
            );
            if (ticket.details?.error === 'DeviceNotRegistered') {
              this.logger.warn(`Removing invalid token for user ${payload.userId}`);
              await this.unregisterToken(payload.userId);
            }
            return false;
          }
        }
      }

      this.logger.log(`Push notification sent to user ${payload.userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${payload.userId}: ${error}`);
      return false;
    }
  }

  async sendToUsers(payloads: PushNotificationPayload[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const userIds = [...new Set(payloads.map(p => p.userId))];

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.expoPushToken'])
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('user.expoPushToken IS NOT NULL')
      .getMany();

    const tokenMap = new Map(users.map(u => [u.id, u.expoPushToken]));
    const messages: any[] = [];
    const messageUserMap: string[] = [];

    for (const payload of payloads) {
      const token = tokenMap.get(payload.userId);
      if (!token || !this.ExpoClass.isExpoPushToken(token)) {
        results.set(payload.userId, false);
        continue;
      }
      messages.push({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      });
      messageUserMap.push(payload.userId);
    }

    if (messages.length === 0) {
      this.logger.debug('No valid push tokens found, skipping batch send');
      return results;
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    let messageIndex = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

        for (const ticket of ticketChunk) {
          const userId = messageUserMap[messageIndex];
          if (ticket.status === 'ok') {
            results.set(userId, true);
          } else {
            results.set(userId, false);
            this.logger.error(`Push error for user ${userId}: ${ticket.message}`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await this.unregisterToken(userId);
            }
          }
          messageIndex++;
        }
      } catch (error) {
        this.logger.error(`Failed to send push notification chunk: ${error}`);
        for (let i = messageIndex; i < messageIndex + chunk.length; i++) {
          results.set(messageUserMap[i], false);
        }
        messageIndex += chunk.length;
      }
    }

    const successCount = [...results.values()].filter(v => v).length;
    this.logger.log(`Batch push: ${successCount}/${payloads.length} sent successfully`);
    return results;
  }
}
