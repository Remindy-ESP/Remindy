export type SubscriptionFrequency = 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial';

export interface SubscriptionProps {
  id?: string;
  userId: string;
  contractId?: number;
  categoryId?: string;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  startDate: Date;
  endDate?: Date;
  nextDueDate: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  isTrialActive?: boolean;
  status: SubscriptionStatus;
  color?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Subscription {
  private readonly _id?: string;
  private _userId: string;
  private _contractId?: number;
  private _categoryId?: string;
  private _name: string;
  private _amount: number;
  private _currency: string;
  private _frequency: SubscriptionFrequency;
  private _startDate: Date;
  private _endDate?: Date;
  private _nextDueDate: Date;
  private _trialStartDate?: Date;
  private _trialEndDate?: Date;
  private readonly _isTrialActive?: boolean;
  private _status: SubscriptionStatus;
  private _color?: string;
  private _notes?: string;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: SubscriptionProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._contractId = props.contractId;
    this._categoryId = props.categoryId;
    this._name = props.name;
    this._amount = props.amount;
    this._currency = props.currency;
    this._frequency = props.frequency;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._nextDueDate = props.nextDueDate;
    this._trialStartDate = props.trialStartDate;
    this._trialEndDate = props.trialEndDate;
    this._isTrialActive = props.isTrialActive;
    this._status = props.status;
    this._color = props.color;
    this._notes = props.notes;
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

  get contractId(): number | undefined {
    return this._contractId;
  }

  get categoryId(): string | undefined {
    return this._categoryId;
  }

  get name(): string {
    return this._name;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get frequency(): SubscriptionFrequency {
    return this._frequency;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | undefined {
    return this._endDate;
  }

  get nextDueDate(): Date {
    return this._nextDueDate;
  }

  get trialStartDate(): Date | undefined {
    return this._trialStartDate;
  }

  get trialEndDate(): Date | undefined {
    return this._trialEndDate;
  }

  get isTrialActive(): boolean | undefined {
    return this._isTrialActive;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get color(): string | undefined {
    return this._color;
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

    const validFrequencies: SubscriptionFrequency[] = [
      'one-time',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
    ];
    if (!validFrequencies.includes(this._frequency)) {
      throw new Error(
        'Invalid frequency. Must be: one-time, weekly, monthly, quarterly, or yearly',
      );
    }

    const validStatuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled', 'trial'];
    if (!validStatuses.includes(this._status)) {
      throw new Error('Invalid status. Must be: active, paused, cancelled, or trial');
    }

    if (this._trialStartDate && this._trialEndDate && this._trialEndDate <= this._trialStartDate) {
      throw new Error('Trial end date must be after trial start date');
    }

    if (this._endDate && this._endDate <= this._startDate) {
      throw new Error('End date must be after start date');
    }

    if (this._color && !/^#[0-9A-Fa-f]{6}$/.test(this._color)) {
      throw new Error('Color must be a valid HEX color code (e.g., #FF5733)');
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

  public updateFrequency(newFrequency: SubscriptionFrequency): void {
    const validFrequencies: SubscriptionFrequency[] = [
      'one-time',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
    ];
    if (!validFrequencies.includes(newFrequency)) {
      throw new Error(
        'Invalid frequency. Must be: one-time, weekly, monthly, quarterly, or yearly',
      );
    }
    this._frequency = newFrequency;
    this.recalculateNextDueDate();
  }

  public updateDates(startDate: Date, nextDueDate: Date, endDate?: Date): void {
    if (nextDueDate <= startDate) {
      throw new Error('Next due date must be after start date');
    }
    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
    this._startDate = startDate;
    this._nextDueDate = nextDueDate;
    this._endDate = endDate;
  }

  public updateTrialDates(trialStartDate?: Date, trialEndDate?: Date): void {
    if (trialStartDate && trialEndDate && trialEndDate <= trialStartDate) {
      throw new Error('Trial end date must be after trial start date');
    }
    this._trialStartDate = trialStartDate;
    this._trialEndDate = trialEndDate;
  }

  public updateStatus(newStatus: SubscriptionStatus): void {
    const validStatuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled', 'trial'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status. Must be: active, paused, cancelled, or trial');
    }
    this._status = newStatus;
  }

  public updateColor(color?: string): void {
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Color must be a valid HEX color code (e.g., #FF5733)');
    }
    this._color = color;
  }

  public updateNotes(notes?: string): void {
    this._notes = notes?.trim();
  }

  public updateContractId(contractId?: number): void {
    this._contractId = contractId;
  }

  public updateCategoryId(categoryId?: string): void {
    this._categoryId = categoryId;
  }

  public pause(): void {
    this._status = 'paused';
  }

  public cancel(): void {
    this._status = 'cancelled';
  }

  public activate(): void {
    this._status = 'active';
  }

  public startTrial(): void {
    this._status = 'trial';
  }

  public isExpired(): boolean {
    return this._status === 'cancelled';
  }

  public isInTrial(): boolean {
    if (!this._trialEndDate) {
      return false;
    }
    return new Date() <= this._trialEndDate;
  }

  private recalculateNextDueDate(): void {
    const date = new Date(this._startDate);

    switch (this._frequency) {
      case 'one-time':
        // For one-time purchases, next due date is same as start date
        this._nextDueDate = date;
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        this._nextDueDate = date;
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        this._nextDueDate = date;
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        this._nextDueDate = date;
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        this._nextDueDate = date;
        break;
    }
  }

  public toJSON(): SubscriptionProps {
    return {
      id: this._id,
      userId: this._userId,
      contractId: this._contractId,
      categoryId: this._categoryId,
      name: this._name,
      amount: this._amount,
      currency: this._currency,
      frequency: this._frequency,
      startDate: this._startDate,
      endDate: this._endDate,
      nextDueDate: this._nextDueDate,
      trialStartDate: this._trialStartDate,
      trialEndDate: this._trialEndDate,
      isTrialActive: this._isTrialActive,
      status: this._status,
      color: this._color,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
