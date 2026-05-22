import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { INotificationRepository } from '../../notification/application/ports/notification-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../notification/application/ports/notification-repository.interface';
import { ExpoPushService } from '../../notification/application/services/expo-push.service';
import { Notification, NotificationType } from '../../notification/domain/notification.entity';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { ReminderEntity } from '../../reminder/infrastructure/persistence/reminder.entity';
import type { PushNotificationPayload } from '../../notification/application/services/expo-push.service';

interface BaseNotificationRow {
  subscriptionId: string;
  subscriptionName: string;
  subscriptionAmount: number;
  subscriptionCurrency: string;
  userId: string;
  reminderId: string;
  reminderChannel: string;
  daysBefore: number;
}

interface DueNotificationRow extends BaseNotificationRow {
  nextDueDate: string;
}

interface TrialEndingRow extends BaseNotificationRow {
  trialEndDate: string;
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
   * Traite deux types de notifications :
   * 1. Renouvellements d'abonnements (subscription_renewal)
   * 2. Fins de périodes d'essai (trial_ending)
   *
   * Optimisé : requêtes SQL avec JOIN au lieu de boucles N+1
   */
  @Cron('0 8 * * *')
  async handleCron() {
    this.logger.log('Starting notifications process...');

    try {
      const result = await this.processNotifications();
      this.logger.log(
        `Notifications process completed. Created: ${result.notificationsCreated}, Push sent: ${result.pushSent}`,
      );
    } catch (error) {
      this.logger.error(`Notifications process failed: ${error}`);
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
    this.logger.log('Manually triggering notifications process...');
    return this.processNotifications();
  }

  /**
   * Core logic — shared between cron and manual trigger
   * Processes both renewal and trial ending notifications
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

    let notificationsCreated = 0;
    let pushSent = 0;
    const pushPayloads: PushNotificationPayload[] = [];
    const uniqueSubscriptionIds = new Set<string>();

    // ─── 0. Transition expired trials to active ───────────────────────
    const transitions = await this.processTrialTransitions(todayStr);
    if (transitions > 0) {
      this.logger.log(`Transitioned ${transitions} expired trials to active status`);
    }

    // ─── 1. Renewal notifications ───────────────────────────────────────
    const renewalResults = await this.processRenewalNotifications(
      todayStr,
      pushPayloads,
      uniqueSubscriptionIds,
    );
    notificationsCreated += renewalResults;

    // ─── 2. Trial ending notifications ──────────────────────────────────
    const trialResults = await this.processTrialEndingNotifications(
      todayStr,
      pushPayloads,
      uniqueSubscriptionIds,
    );
    notificationsCreated += trialResults;

    // ─── 3. Send all push notifications in batch ────────────────────────
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

  /**
   * Transition subscriptions from 'trial' to 'active' when trial period ends
   */
  private async processTrialTransitions(todayStr: string): Promise<number> {
    const result = await this.subscriptionRepository
      .createQueryBuilder()
      .update(SubscriptionEntity)
      .set({ status: 'active' })
      .where('status = :trialStatus', { trialStatus: 'trial' })
      .andWhere('trial_end_date < :today', { today: todayStr })
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected || 0;
  }

  /**
   * Persist a single notification entry and queue its push payload.
   * Shared by both renewal and trial-ending loops to avoid duplication.
   */
  private async persistNotification(
    row: BaseNotificationRow,
    notificationType: NotificationType,
    pushType: string,
    title: string,
    body: string,
    dateKey: string,
    dateValue: string,
    pushPayloads: PushNotificationPayload[],
  ): Promise<void> {
    const notification = new Notification({
      userId: row.userId,
      reminderId: row.reminderId,
      type: notificationType,
      channel: row.reminderChannel as any,
      title,
      body,
      status: 'pending',
      metadata: { subscriptionId: row.subscriptionId, [dateKey]: dateValue, reminderId: row.reminderId },
    });
    notification.markAsSent();
    await this.notificationRepository.save(notification);
    pushPayloads.push({
      userId: row.userId,
      title,
      body,
      data: { type: pushType, subscriptionId: row.subscriptionId, [dateKey]: dateValue },
    });
  }

  /**
   * Process subscription renewal notifications
   * Finds active subscriptions whose next_due_date matches a user's reminder daysBefore
   */
  private async processRenewalNotifications(
    todayStr: string,
    pushPayloads: PushNotificationPayload[],
    uniqueSubscriptionIds: Set<string>,
  ): Promise<number> {
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
        'notifications',
        'n',
        `n.user_id = s.user_id
         AND n.type = 'subscription_renewed'
         AND n.metadata->>'subscriptionId' = CAST(s.id AS TEXT)
         AND n.metadata->>'nextDueDate' = TO_CHAR(s.next_due_date, 'YYYY-MM-DD')`,
      )
      .where('s.status IN (:...statuses)', { statuses: ['active', 'trial'] })
      .andWhere('s.next_due_date IS NOT NULL')
      .andWhere('s.deleted_at IS NULL')
      .andWhere(`(DATE(s.next_due_date) - DATE(:today)) = r.days_before`, { today: todayStr })
      .andWhere('n.id IS NULL')
      .getRawMany();

    this.logger.log(`Found ${dueNotifications.length} renewal notification(s) to create`);

    let created = 0;

    for (const row of dueNotifications) {
      try {
        uniqueSubscriptionIds.add(row.subscriptionId);
        const title = `Renouvellement`;
        const body = `${row.subscriptionName} — renouvellement dans ${row.daysBefore} jour(s)`;
        await this.persistNotification(
          row, 'subscription_renewed', 'subscription_renewal', title, body,
          'nextDueDate', row.nextDueDate, pushPayloads,
        );
        created++;
        this.logger.log(
          `Created renewal notification for subscription ${row.subscriptionId} - User: ${row.userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create renewal notification for subscription ${row.subscriptionId}: ${error}`,
        );
      }
    }

    return created;
  }

  /**
   * Process trial ending notifications
   * Finds subscriptions with status 'trial' whose trial_end_date matches a user's reminder daysBefore
   */
  private async processTrialEndingNotifications(
    todayStr: string,
    pushPayloads: PushNotificationPayload[],
    uniqueSubscriptionIds: Set<string>,
  ): Promise<number> {
    const trialNotifications: TrialEndingRow[] = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select([
        's.id AS "subscriptionId"',
        's.name AS "subscriptionName"',
        's.amount AS "subscriptionAmount"',
        's.currency AS "subscriptionCurrency"',
        'TO_CHAR(s.trial_end_date, \'YYYY-MM-DD\') AS "trialEndDate"',
        's.user_id AS "userId"',
        'r.id AS "reminderId"',
        'r.channel AS "reminderChannel"',
        'r.days_before AS "daysBefore"',
      ])
      .innerJoin(
        ReminderEntity,
        'r',
        `r.user_id = s.user_id
         AND r.type = 'trial_ending'
         AND r.enabled = true
         AND r.deleted_at IS NULL
         AND (r.subscription_id IS NULL OR r.subscription_id = s.id)`,
      )
      .leftJoin(
        'notifications',
        'n',
        `n.user_id = s.user_id
         AND n.type = 'trial_ending'
         AND n.metadata->>'subscriptionId' = CAST(s.id AS TEXT)
         AND n.metadata->>'trialEndDate' = TO_CHAR(s.trial_end_date, 'YYYY-MM-DD')`,
      )
      .where('s.status = :trialStatus', { trialStatus: 'trial' })
      .andWhere('s.trial_end_date IS NOT NULL')
      .andWhere('s.deleted_at IS NULL')
      .andWhere(`(DATE(s.trial_end_date) - DATE(:today)) = r.days_before`, { today: todayStr })
      .andWhere('n.id IS NULL')
      .getRawMany();

    this.logger.log(`Found ${trialNotifications.length} trial ending notification(s) to create`);

    let created = 0;

    for (const row of trialNotifications) {
      try {
        uniqueSubscriptionIds.add(row.subscriptionId);
        const title = `Période d'essai`;
        const body = `${row.subscriptionName} — essai gratuit se termine dans ${row.daysBefore} jour(s)`;
        await this.persistNotification(
          row, 'trial_ending', 'trial_ending', title, body,
          'trialEndDate', row.trialEndDate, pushPayloads,
        );
        created++;
        this.logger.log(
          `Created trial ending notification for subscription ${row.subscriptionId} - User: ${row.userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create trial ending notification for subscription ${row.subscriptionId}: ${error}`,
        );
      }
    }

    return created;
  }
}
