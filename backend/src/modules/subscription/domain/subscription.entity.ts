export type SubscriptionPeriodType = 'day' | 'week' | 'month' | 'year';

export interface SubscriptionProps {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  periodType: SubscriptionPeriodType;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Subscription {
  private readonly _id?: string;
  private _userId: string;
  private _name: string;
  private _description?: string;
  private _amount: number;
  private _currency: string;
  private _periodType: SubscriptionPeriodType;
  private _startDate: Date;
  private _endDate?: Date;
  private _isActive: boolean;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: SubscriptionProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._name = props.name;
    this._description = props.description;
    this._amount = props.amount;
    this._currency = props.currency;
    this._periodType = props.periodType;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._isActive = props.isActive;
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

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get periodType(): SubscriptionPeriodType {
    return this._periodType;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | undefined {
    return this._endDate;
  }

  get isActive(): boolean {
    return this._isActive;
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

  // Business logic methods
  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Subscription name cannot be empty');
    }

    if (this._name.length > 255) {
      throw new Error('Subscription name cannot exceed 255 characters');
    }

    if (this._amount < 0) {
      throw new Error('Subscription amount cannot be negative');
    }

    if (!this._currency || this._currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }

    if (this._currency.length !== 3) {
      throw new Error('Currency must be a valid ISO 4217 code (3 characters)');
    }

    const validPeriodTypes: SubscriptionPeriodType[] = ['day', 'week', 'month', 'year'];
    if (!validPeriodTypes.includes(this._periodType)) {
      throw new Error('Invalid period type. Must be: day, week, month, or year');
    }

    if (this._endDate && this._endDate < this._startDate) {
      throw new Error('End date cannot be before start date');
    }
  }

  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Subscription name cannot be empty');
    }
    if (newName.length > 255) {
      throw new Error('Subscription name cannot exceed 255 characters');
    }
    this._name = newName.trim();
  }

  public updateDescription(description?: string): void {
    this._description = description?.trim();
  }

  public updateAmount(newAmount: number): void {
    if (newAmount < 0) {
      throw new Error('Subscription amount cannot be negative');
    }
    this._amount = newAmount;
  }

  public updateCurrency(newCurrency: string): void {
    if (!newCurrency || newCurrency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }
    if (newCurrency.length !== 3) {
      throw new Error('Currency must be a valid ISO 4217 code (3 characters)');
    }
    this._currency = newCurrency.toUpperCase();
  }

  public updatePeriodType(newPeriodType: SubscriptionPeriodType): void {
    const validPeriodTypes: SubscriptionPeriodType[] = ['day', 'week', 'month', 'year'];
    if (!validPeriodTypes.includes(newPeriodType)) {
      throw new Error('Invalid period type. Must be: day, week, month, or year');
    }
    this._periodType = newPeriodType;
  }

  public updateDates(startDate: Date, endDate?: Date): void {
    if (endDate && endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }
    this._startDate = startDate;
    this._endDate = endDate;
  }

  public activate(): void {
    this._isActive = true;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public isExpired(): boolean {
    if (!this._endDate) {
      return false;
    }
    return new Date() > this._endDate;
  }

  public getDurationInDays(): number {
    if (!this._endDate) {
      return Infinity;
    }
    const diff = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  public toJSON(): SubscriptionProps {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      description: this._description,
      amount: this._amount,
      currency: this._currency,
      periodType: this._periodType,
      startDate: this._startDate,
      endDate: this._endDate,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
