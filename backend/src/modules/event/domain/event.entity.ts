export type EventStatus = 'scheduled' | 'completed' | 'canceled' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface EventProps {
  id?: string;
  subscriptionId: string;
  eventSeriesId?: string;
  title: string;
  amount: number;
  startsAt: Date;
  endsAt?: Date;
  status: EventStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Event {
  private _id?: string;
  private _subscriptionId: string;
  private _eventSeriesId?: string;
  private _title: string;
  private _amount: number;
  private _startsAt: Date;
  private _endsAt?: Date;
  private _status: EventStatus;
  private _paymentStatus?: PaymentStatus;
  private _notes?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: EventProps) {
    this._id = props.id;
    this._subscriptionId = props.subscriptionId;
    this._eventSeriesId = props.eventSeriesId;
    this._title = props.title.trim();
    this._amount = props.amount;
    this._startsAt = props.startsAt;
    this._endsAt = props.endsAt;
    this._status = props.status;
    this._paymentStatus = props.paymentStatus;
    this._notes = props.notes?.trim();
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get subscriptionId(): string {
    return this._subscriptionId;
  }

  get eventSeriesId(): string | undefined {
    return this._eventSeriesId;
  }

  get title(): string {
    return this._title;
  }

  get amount(): number {
    return this._amount;
  }

  get startsAt(): Date {
    return this._startsAt;
  }

  get endsAt(): Date | undefined {
    return this._endsAt;
  }

  get status(): EventStatus {
    return this._status;
  }

  get paymentStatus(): PaymentStatus | undefined {
    return this._paymentStatus;
  }

  get notes(): string | undefined {
    return this._notes;
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
    if (!this._title || this._title.length === 0) {
      throw new Error('Event title cannot be empty');
    }

    if (this._title.length > 255) {
      throw new Error('Event title cannot exceed 255 characters');
    }

    if (this._amount <= 0) {
      throw new Error('Event amount must be positive');
    }

    const validStatuses: EventStatus[] = ['scheduled', 'completed', 'canceled', 'failed'];
    if (!validStatuses.includes(this._status)) {
      throw new Error('Invalid event status');
    }

    if (this._paymentStatus) {
      const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed'];
      if (!validPaymentStatuses.includes(this._paymentStatus)) {
        throw new Error('Invalid payment status');
      }
    }

    if (this._endsAt && this._endsAt < this._startsAt) {
      throw new Error('End date must be after start date');
    }
  }

  // Business logic methods
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Event title cannot be empty');
    }
    if (title.length > 255) {
      throw new Error('Event title cannot exceed 255 characters');
    }
    this._title = title.trim();
  }

  public updateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Event amount must be positive');
    }
    this._amount = amount;
  }

  public reschedule(startsAt: Date, endsAt?: Date): void {
    if (endsAt && endsAt < startsAt) {
      throw new Error('End date must be after start date');
    }
    this._startsAt = startsAt;
    this._endsAt = endsAt;
  }

  public updateStatus(status: EventStatus): void {
    const validStatuses: EventStatus[] = ['scheduled', 'completed', 'canceled', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid event status');
    }
    this._status = status;
  }

  public updatePaymentStatus(paymentStatus?: PaymentStatus): void {
    if (paymentStatus) {
      const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status');
      }
    }
    this._paymentStatus = paymentStatus;
  }

  public updateNotes(notes?: string): void {
    this._notes = notes?.trim();
  }

  public complete(): void {
    this._status = 'completed';
  }

  public cancel(): void {
    this._status = 'canceled';
  }

  public markAsPaid(): void {
    this._paymentStatus = 'paid';
    this._status = 'completed';
  }

  public markAsFailed(): void {
    this._status = 'failed';
    this._paymentStatus = 'failed';
  }

  public isOverdue(): boolean {
    return this._status === 'scheduled' && this._startsAt < new Date();
  }
}
