export type NotificationType =
  | 'reminder'
  | 'payment_overdue'
  | 'trial_ending'
  | 'subscription_renewed'
  | 'document_processed';

export type NotificationChannel = 'email' | 'push' | 'sms';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'snoozed';

export interface NotificationProps {
  id?: string;
  userId: string;
  eventId?: string;
  reminderId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  sentAt?: Date;
  readAt?: Date;
  status: NotificationStatus;
  snoozedUntil?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  deletedAt?: Date;
}

export class Notification {
  private _id?: string;
  private _userId: string;
  private _eventId?: string;
  private _reminderId?: string;
  private _type: NotificationType;
  private _channel: NotificationChannel;
  private _title: string;
  private _body: string;
  private _sentAt?: Date;
  private _readAt?: Date;
  private _status: NotificationStatus;
  private _snoozedUntil?: Date;
  private _errorMessage?: string;
  private _metadata?: Record<string, any>;
  private _createdAt?: Date;
  private _deletedAt?: Date;

  constructor(props: NotificationProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._eventId = props.eventId;
    this._reminderId = props.reminderId;
    this._type = props.type;
    this._channel = props.channel;
    this._title = props.title.trim();
    this._body = props.body.trim();
    this._sentAt = props.sentAt;
    this._readAt = props.readAt;
    this._status = props.status;
    this._snoozedUntil = props.snoozedUntil;
    this._errorMessage = props.errorMessage?.trim();
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  private validate(): void {
    if (!this._title || this._title.length === 0) {
      throw new Error('Notification title cannot be empty');
    }

    if (this._title.length > 255) {
      throw new Error('Notification title cannot exceed 255 characters');
    }

    if (!this._body || this._body.length === 0) {
      throw new Error('Notification body cannot be empty');
    }

    if (this._status === 'snoozed' && !this._snoozedUntil) {
      throw new Error('Snoozed notifications must have a snoozedUntil date');
    }

    if (this._status === 'snoozed' && this._snoozedUntil && this._snoozedUntil <= new Date()) {
      throw new Error('Snoozed until date must be in the future');
    }
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get eventId(): string | undefined {
    return this._eventId;
  }

  get reminderId(): string | undefined {
    return this._reminderId;
  }

  get type(): NotificationType {
    return this._type;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get title(): string {
    return this._title;
  }

  get body(): string {
    return this._body;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get snoozedUntil(): Date | undefined {
    return this._snoozedUntil;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // Business methods
  public markAsRead(): void {
    if (this._readAt) {
      throw new Error('Notification already marked as read');
    }
    this._readAt = new Date();
  }

  public snooze(until: Date): void {
    if (until <= new Date()) {
      throw new Error('Snooze date must be in the future');
    }
    this._status = 'snoozed';
    this._snoozedUntil = until;
  }

  public markAsSent(): void {
    this._status = 'sent';
    this._sentAt = new Date();
  }

  public markAsFailed(errorMessage: string): void {
    this._status = 'failed';
    this._errorMessage = errorMessage.trim();
  }

  public unsnooze(): void {
    if (this._status !== 'snoozed') {
      throw new Error('Notification is not snoozed');
    }
    this._status = 'pending';
    this._snoozedUntil = undefined;
  }

  public isRead(): boolean {
    return this._readAt !== undefined;
  }

  public isSnoozed(): boolean {
    return this._status === 'snoozed';
  }
}
