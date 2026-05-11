import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { EUser } from '../../../../infrastructure/database/entities/user.entity';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo: Expo;

  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
  ) {
    this.expo = new Expo();
  }

  /**
   * Register an Expo push token for a user
   */
  async registerToken(userId: string, token: string): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token for user ${userId}: ${String(token)}`);
      throw new BadRequestException(`Invalid Expo push token: ${String(token)}`);
    }

    await this.userRepository.update(userId, { expoPushToken: token });
    this.logger.log(`Registered push token for user ${userId}`);
  }

  /**
   * Unregister the Expo push token for a user
   */
  async unregisterToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, { expoPushToken: null as any });
    this.logger.log(`Unregistered push token for user ${userId}`);
  }

  /**
   * Send a push notification to a single user
   */
  async sendToUser(payload: PushNotificationPayload): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      select: ['id', 'expoPushToken'],
    });

    if (!user?.expoPushToken) {
      this.logger.debug(`No push token for user ${payload.userId}, skipping push`);
      return false;
    }

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      this.logger.warn(`Invalid stored push token for user ${payload.userId}`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        const ticketChunk: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
        for (const ticket of ticketChunk) {
          if (ticket.status === 'error') {
            this.logger.error(
              `Push notification error for user ${payload.userId}: ${ticket.message}`,
            );
            // If the token is invalid, remove it
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

  /**
   * Send push notifications to multiple users in batch
   */
  async sendToUsers(payloads: PushNotificationPayload[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    // Fetch all user tokens in a single query
    const userIds = [...new Set(payloads.map(p => p.userId))];
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.expoPushToken'])
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('user.expoPushToken IS NOT NULL')
      .getMany();

    const tokenMap = new Map(users.map(u => [u.id, u.expoPushToken]));

    // Build messages only for users with valid tokens
    const messages: ExpoPushMessage[] = [];
    const messageUserMap: string[] = [];

    for (const payload of payloads) {
      const token = tokenMap.get(payload.userId);
      if (!token || !Expo.isExpoPushToken(token)) {
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

    // Send in chunks (Expo recommends max 100 per chunk)
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
        // Mark remaining in this chunk as failed
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
