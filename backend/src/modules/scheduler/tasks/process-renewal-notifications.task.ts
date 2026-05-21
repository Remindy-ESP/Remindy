import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { INotificationRepository } from '../../notification/application/ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../notification/application/ports/notification-repository.interface';
import { ExpoPushService } from '../../notification/application/services/expo-push.service';
import { Notification } from '../../notification/domain/notification.entity';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { ReminderEntity } from '../../reminder/infrastructure/persistence/reminder.entity';
import { NotificationEntity } from '../../notification/infrastructure/persistence/notification.entity';
import type { PushNotificationPayload } from '../../notification/application/services/expo-push.service';

interface DueNotificationRow {
  subscriptionId: string;
  subscriptionName: string;
  subscriptionAmount: number;
  subscriptionCurrency: string;
  nextDueDate: string;
  userId: string;
  reminderId: string;
  reminderChannel: string;
  daysBefore: number;
}

@Injectable()
export class ProcessRenewalNotificationsTask {
  private readonly logger = new Logger(ProcessRenewalNotificationsTask.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly expoPushService: ExpoPushService,
  ) {}

  /**
   * Cron job qui s'exécute tous les jours à 8h du matin (heure serveur)
   * Recherche les abonnements à renouveler et crée les notifications in-app + push
   * basées sur les rappels (reminders)
   *
   * Optimisé : une seule requête SQL avec JOIN au lieu de boucles N+1
   */
  @Cron('0 8 * * *')
  async handleCron() {
    this.logger.log('Starting renewal notifications process...');

    try {
      const result = await this.processNotifications();
      this.logger.log(
        `Renewal notifications process completed. Created: ${result.notificationsCreated}, Push sent: ${result.pushSent}`,
      );
    } catch (error) {
      this.logger.error(`Renewal notifications process failed: ${error}`);
    }
  }

  /**
   * Méthode pour déclencher manuellement la création de notifications (utile pour les tests)
   */
  async triggerManually(): Promise<{
    subscriptionsProcessed: number;
    notificationsCreated: number;
    pushSent: number;
  }> {
    this.logger.log('Manually triggering renewal notifications process...');
    return this.processNotifications();
  }

  /**
   * Core logic — shared between cron and manual trigger
   * Uses a single optimized SQL query to find all due notifications
   */
  private async processNotifications(): Promise<{
    subscriptionsProcessed: number;
    notificationsCreated: number;
    pushSent: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use local timezone date (not UTC) to avoid off-by-one day errors
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Single optimized query: JOIN subscriptions + reminders + LEFT JOIN notifications (dedup)
    const dueNotifications: DueNotificationRow[] = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select([
        's.id AS "subscriptionId"',
        's.name AS "subscriptionName"',
        's.amount AS "subscriptionAmount"',
        's.currency AS "subscriptionCurrency"',
        'TO_CHAR(s.next_due_date, \'YYYY-MM-DD\') AS "nextDueDate"',
        's.user_id AS "userId"',
        'r.id AS "reminderId"',
        'r.channel AS "reminderChannel"',
        'r.days_before AS "daysBefore"',
      ])
      .innerJoin(
        ReminderEntity,
        'r',
        `r.user_id = s.user_id
         AND r.type = 'subscription_renewal'
         AND r.enabled = true
         AND r.deleted_at IS NULL
         AND (r.subscription_id IS NULL OR r.subscription_id = s.id)`,
      )
      .leftJoin(
        NotificationEntity,
        'n',
        `n.user_id = s.user_id
         AND n.type = 'subscription_renewed'
         AND n.metadata->>'subscriptionId' = CAST(s.id AS TEXT)
         AND n.metadata->>'nextDueDate' = TO_CHAR(s.next_due_date, 'YYYY-MM-DD')`,
      )
      .where('s.status = :status', { status: 'active' })
      .andWhere('s.next_due_date IS NOT NULL')
      .andWhere('s.deleted_at IS NULL')
      .andWhere(`(DATE(s.next_due_date) - DATE(:today)) = r.days_before`, { today: todayStr })
      .andWhere('n.id IS NULL') // deduplication: no existing notification
      .getRawMany();

    this.logger.log(`Found ${dueNotifications.length} due notification(s) to create`);

    if (dueNotifications.length === 0) {
      return { subscriptionsProcessed: 0, notificationsCreated: 0, pushSent: 0 };
    }

    let notificationsCreated = 0;
    let pushSent = 0;
    const pushPayloads: PushNotificationPayload[] = [];
    const uniqueSubscriptionIds = new Set<string>();

    for (const row of dueNotifications) {
      try {
        uniqueSubscriptionIds.add(row.subscriptionId);

        const dueDate = new Date(row.nextDueDate);
        const title = `Renouvellement ${row.subscriptionName} dans ${row.daysBefore} jour(s)`;
        const body = `Votre abonnement ${row.subscriptionName} de ${row.subscriptionAmount}${row.subscriptionCurrency} sera renouvelé le ${dueDate.toLocaleDateString('fr-FR')}`;

        // Create in-app notification
        const notification = new Notification({
          userId: row.userId,
          reminderId: row.reminderId,
          type: 'subscription_renewed',
          channel: row.reminderChannel as any,
          title,
          body,
          status: 'pending',
          metadata: {
            subscriptionId: row.subscriptionId,
            nextDueDate: row.nextDueDate,
            reminderId: row.reminderId,
          },
        });

        // Mark as sent (in-app is instant)
        notification.markAsSent();

        await this.notificationRepository.save(notification);
        notificationsCreated++;

        this.logger.log(
          `Created notification for subscription ${row.subscriptionId} - User: ${row.userId}`,
        );

        // Queue push notification
        pushPayloads.push({
          userId: row.userId,
          title,
          body,
          data: {
            type: 'subscription_renewal',
            subscriptionId: row.subscriptionId,
            nextDueDate: row.nextDueDate,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to create notification for subscription ${row.subscriptionId}: ${error}`,
        );
      }
    }

    // Send push notifications in batch
    if (pushPayloads.length > 0) {
      try {
        const pushResults = await this.expoPushService.sendToUsers(pushPayloads);
        pushSent = [...pushResults.values()].filter(v => v).length;
        this.logger.log(`Push notifications: ${pushSent}/${pushPayloads.length} sent successfully`);
      } catch (error) {
        this.logger.error(`Failed to send batch push notifications: ${error}`);
      }
    }

    return {
      subscriptionsProcessed: uniqueSubscriptionIds.size,
      notificationsCreated,
      pushSent,
    };
  }
}
