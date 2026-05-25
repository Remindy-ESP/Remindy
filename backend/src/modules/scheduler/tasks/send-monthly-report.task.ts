import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserPreferenceEntity } from '../../../infrastructure/database/entities/user-preference.entity';
import { EUser } from '../../../infrastructure/database/entities/user.entity';
import { SubscriptionEntity } from '../../subscription/infrastructure/persistence/subscription.entity';
import { IEmailService, MonthlyReportData } from '../../auth/infrastructure/services/email.service';

@Injectable()
export class SendMonthlyReportTask {
  private readonly logger = new Logger(SendMonthlyReportTask.name);

  constructor(
    @InjectRepository(UserPreferenceEntity)
    private readonly preferencesRepository: Repository<UserPreferenceEntity>,
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly emailService: IEmailService,
  ) {}

  @Cron('0 8 1 * *')
  async handleCron() {
    this.logger.log('Starting monthly report generation...');
    try {
      const result = await this.processMonthlyReports();
      this.logger.log(`Monthly reports completed. Sent: ${result.sent}, Failed: ${result.failed}`);
    } catch (error) {
      this.logger.error(`Monthly report generation failed: ${error}`);
    }
  }

  async triggerManually(): Promise<{ sent: number; failed: number }> {
    this.logger.log('Manually triggering monthly reports...');
    return this.processMonthlyReports();
  }

  private async processMonthlyReports(): Promise<{ sent: number; failed: number }> {
    const users = await this.getEligibleUsers();
    this.logger.log(`Found ${users.length} eligible user(s) for monthly report`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const reportData = await this.buildReportData(user);
        await this.emailService.sendMonthlyReport({ to: user.email, data: reportData });
        sent++;
        await this.delay(200);
      } catch (error) {
        failed++;
        this.logger.error(`Failed to send monthly report to ${user.email}: ${error}`);
      }
    }

    return { sent, failed };
  }

  private async getEligibleUsers(): Promise<EUser[]> {
    const preferences = await this.preferencesRepository.find({
      where: { monthlyReportEnabled: true, deletedAt: IsNull() },
      select: ['userId'],
    });

    if (preferences.length === 0) return [];

    const userIds = preferences.map(p => p.userId);
    return this.userRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...userIds)', { userIds })
      .andWhere('u.deletedAt IS NULL')
      .getMany();
  }

  private async buildReportData(user: EUser): Promise<MonthlyReportData> {
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const monthLabel = firstOfPreviousMonth.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    const subscriptions = await this.subscriptionRepository.find({
      where: { userId: user.id, deletedAt: IsNull() },
      relations: ['category'],
    });

    const activeSubscriptions = subscriptions.filter(
      s => s.status === 'active' || s.status === 'trial',
    );

    const currentMonthSubs = this.getSubscriptionsActiveInPeriod(
      subscriptions,
      firstOfPreviousMonth,
      firstOfCurrentMonth,
    );

    const previousMonthSubs = this.getSubscriptionsActiveInPeriod(
      subscriptions,
      firstOfTwoMonthsAgo,
      firstOfPreviousMonth,
    );

    const categorySummary = this.buildCategorySummary(currentMonthSubs);
    const previousTotal = this.calculateMonthlyTotal(previousMonthSubs);
    const currentTotal = categorySummary.reduce((sum, c) => sum + c.total, 0);

    const topCategory =
      categorySummary.length > 0
        ? categorySummary.reduce((max, c) => (c.total > max.total ? c : max), categorySummary[0])
        : null;

    const { percentageChange, trend } = this.computeChange(currentTotal, previousTotal);

    const currency = subscriptions.length > 0 ? subscriptions[0].currency : 'EUR';

    return {
      userName: user.firstName || user.email.split('@')[0],
      month: monthLabel,
      totalExpenses: Math.round(currentTotal * 100) / 100,
      previousTotalExpenses: Math.round(previousTotal * 100) / 100,
      percentageChange,
      trend,
      categorySummary,
      topCategory,
      activeSubscriptionsCount: activeSubscriptions.length,
      currency,
    };
  }

  private getSubscriptionsActiveInPeriod(
    subscriptions: SubscriptionEntity[],
    periodStart: Date,
    periodEnd: Date,
  ): SubscriptionEntity[] {
    return subscriptions.filter(s => {
      if (s.status === 'cancelled' && s.endDate && s.endDate < periodStart) return false;
      if (s.startDate > periodEnd) return false;
      return s.status === 'active' || s.status === 'trial' || s.status === 'paused';
    });
  }

  private buildCategorySummary(
    subscriptions: SubscriptionEntity[],
  ): { name: string; total: number }[] {
    const map = new Map<string, number>();

    for (const sub of subscriptions) {
      const categoryName = sub.category?.name || 'Sans catégorie';
      const monthlyAmount = this.toMonthlyAmount(sub);
      map.set(categoryName, (map.get(categoryName) || 0) + monthlyAmount);
    }

    return [...map.entries()]
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }

  private calculateMonthlyTotal(subscriptions: SubscriptionEntity[]): number {
    return subscriptions.reduce((sum, sub) => sum + this.toMonthlyAmount(sub), 0);
  }

  private toMonthlyAmount(sub: SubscriptionEntity): number {
    const amount = Number(sub.amount);
    switch (sub.frequency) {
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      default:
        return amount;
    }
  }

  private computeChange(
    current: number,
    previous: number,
  ): { percentageChange: number; trend: 'up' | 'down' | 'stable' } {
    if (previous === 0) {
      if (current === 0) return { percentageChange: 0, trend: 'stable' };
      return { percentageChange: 100, trend: 'up' };
    }
    const raw = ((current - previous) / previous) * 100;
    const percentageChange = Math.round(raw * 10) / 10;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 0.1) trend = 'up';
    else if (percentageChange < -0.1) trend = 'down';
    return { percentageChange, trend };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
