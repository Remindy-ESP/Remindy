export type ReminderType =
  | 'subscription_renewal'
  | 'trial_ending'
  | 'payment_due'
  | 'payment_failed'
  | 'budget_alert';

export type ReminderChannel = 'email' | 'push' | 'sms';

export interface ReminderProps {
  id?: string;
  userId: string;
  subscriptionId?: string;
  type: ReminderType;
  daysBefore: number;
  enabled: boolean;
  channel: ReminderChannel;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Reminder {
  private _id?: string;
  private _userId: string;
  private _subscriptionId?: string;
  private _type: ReminderType;
  private _daysBefore: number;
  private _enabled: boolean;
  private _channel: ReminderChannel;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: ReminderProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._subscriptionId = props.subscriptionId;
    this._type = props.type;
    this._daysBefore = props.daysBefore;
    this._enabled = props.enabled;
    this._channel = props.channel;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get subscriptionId(): string | undefined {
    return this._subscriptionId;
  }

  get type(): ReminderType {
    return this._type;
  }

  get daysBefore(): number {
    return this._daysBefore;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get channel(): ReminderChannel {
    return this._channel;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // Validation
  private validate(): void {
    if (!this._userId || this._userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (this._daysBefore <= 0) {
      throw new Error('Days before must be greater than 0');
    }

    if (this._daysBefore > 365) {
      throw new Error('Days before cannot exceed 365 days');
    }

    const validTypes: ReminderType[] = [
      'subscription_renewal',
      'trial_ending',
      'payment_due',
      'payment_failed',
      'budget_alert',
    ];
    if (!validTypes.includes(this._type)) {
      throw new Error('Invalid reminder type');
    }

    const validChannels: ReminderChannel[] = ['email', 'push', 'sms'];
    if (!validChannels.includes(this._channel)) {
      throw new Error('Invalid reminder channel');
    }
  }

  // Business logic methods
  public enable(): void {
    this._enabled = true;
  }

  public disable(): void {
    this._enabled = false;
  }

  public updateDaysBefore(daysBefore: number): void {
    if (daysBefore <= 0) {
      throw new Error('Days before must be greater than 0');
    }
    if (daysBefore > 365) {
      throw new Error('Days before cannot exceed 365 days');
    }
    this._daysBefore = daysBefore;
  }

  public updateChannel(channel: ReminderChannel): void {
    const validChannels: ReminderChannel[] = ['email', 'push', 'sms'];
    if (!validChannels.includes(channel)) {
      throw new Error('Invalid reminder channel');
    }
    this._channel = channel;
  }

  public isGlobal(): boolean {
    return this._subscriptionId === undefined || this._subscriptionId === null;
  }

  public isForSubscription(subscriptionId: string): boolean {
    return this._subscriptionId === subscriptionId;
  }
}
