export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

/**
 * UserPreference Domain Entity
 */
export class UserPreference {
  private userId: string;
  private theme: Theme;
  private notificationEmail: boolean;
  private notificationPush: boolean;
  private notificationSms: boolean;
  private defaultReminderDelay: number;
  private currency: string;
  private showOnlineStatus: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(props: {
    userId: string;
    theme?: Theme;
    notificationEmail?: boolean;
    notificationPush?: boolean;
    notificationSms?: boolean;
    defaultReminderDelay?: number;
    currency?: string;
    showOnlineStatus?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    this.userId = props.userId;
    this.theme = props.theme ?? Theme.LIGHT;
    this.notificationEmail = props.notificationEmail ?? true;
    this.notificationPush = props.notificationPush ?? true;
    this.notificationSms = props.notificationSms ?? false;
    this.defaultReminderDelay = props.defaultReminderDelay ?? 3;
    this.currency = props.currency ?? 'EUR';
    this.showOnlineStatus = props.showOnlineStatus ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;

    this.validateReminderDelay(this.defaultReminderDelay);
  }

  private validateReminderDelay(delay: number): void {
    if (delay < 1 || delay > 365) {
      throw new Error('Reminder delay must be between 1 and 365 days');
    }
  }

  getUserId(): string {
    return this.userId;
  }

  getTheme(): Theme {
    return this.theme;
  }

  isEmailNotificationEnabled(): boolean {
    return this.notificationEmail;
  }

  isPushNotificationEnabled(): boolean {
    return this.notificationPush;
  }

  isSmsNotificationEnabled(): boolean {
    return this.notificationSms;
  }

  getDefaultReminderDelay(): number {
    return this.defaultReminderDelay;
  }

  getCurrency(): string {
    return this.currency;
  }

  shouldShowOnlineStatus(): boolean {
    return this.showOnlineStatus;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  // Actions
  updateTheme(theme: Theme): void {
    this.theme = theme;
    this.touch();
  }

  enableEmailNotifications(): void {
    this.notificationEmail = true;
    this.touch();
  }

  disableEmailNotifications(): void {
    this.notificationEmail = false;
    this.touch();
  }

  enablePushNotifications(): void {
    this.notificationPush = true;
    this.touch();
  }

  disablePushNotifications(): void {
    this.notificationPush = false;
    this.touch();
  }

  enableSmsNotifications(): void {
    this.notificationSms = true;
    this.touch();
  }

  disableSmsNotifications(): void {
    this.notificationSms = false;
    this.touch();
  }

  updateDefaultReminderDelay(days: number): void {
    this.validateReminderDelay(days);
    this.defaultReminderDelay = days;
    this.touch();
  }

  updateCurrency(currency: string): void {
    if (!currency || currency.length !== 3) {
      throw new Error('Currency code must be 3 characters (ISO 4217)');
    }
    this.currency = currency.toUpperCase();
    this.touch();
  }

  showOnline(): void {
    this.showOnlineStatus = true;
    this.touch();
  }

  hideOnline(): void {
    this.showOnlineStatus = false;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
