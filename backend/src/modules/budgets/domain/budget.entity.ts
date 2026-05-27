export type BudgetPeriod = 'monthly' | 'yearly';

export interface BudgetProps {
  id?: string;
  userId: string;
  categoryId?: string | null;
  subscriptionIds?: string[];
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date | null;
  isActive?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Budget {
  private readonly _id?: string;
  private _userId: string;
  private _categoryId?: string | null;
  private _subscriptionIds: string[];
  private _name: string;
  private _amount: number;
  private _currency: string;
  private _period: BudgetPeriod;
  private _startDate: Date;
  private _endDate?: Date | null;
  private _isActive: boolean;
  private _notes?: string;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: BudgetProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._categoryId = props.categoryId ?? null;
    this._subscriptionIds = props.subscriptionIds ?? [];
    this._name = props.name;
    this._amount = props.amount;
    this._currency = props.currency;
    this._period = props.period;
    this._startDate = props.startDate;
    this._endDate = props.endDate ?? null;
    this._isActive = props.isActive ?? true;
    this._notes = props.notes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get categoryId(): string | null | undefined {
    return this._categoryId;
  }

  get subscriptionIds(): string[] {
    return this._subscriptionIds;
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

  get period(): BudgetPeriod {
    return this._period;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | null | undefined {
    return this._endDate;
  }

  get isActive(): boolean {
    return this._isActive;
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

  private validate(): void {
    if (!this._userId || this._userId.trim().length === 0) {
      throw new Error('Budget userId is required');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Budget name cannot be empty');
    }

    if (this._name.length > 100) {
      throw new Error('Budget name cannot exceed 100 characters');
    }

    if (this._amount <= 0) {
      throw new Error('Budget amount must be greater than zero');
    }

    if (!this._currency || this._currency.length !== 3) {
      throw new Error('Currency must be a valid ISO 4217 code (3 characters)');
    }

    const validPeriods: BudgetPeriod[] = ['monthly', 'yearly'];
    if (!validPeriods.includes(this._period)) {
      throw new Error('Invalid period. Must be: monthly or yearly');
    }

    if (this._endDate && this._endDate <= this._startDate) {
      throw new Error('End date must be after start date');
    }
  }

  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Budget name cannot be empty');
    }
    if (newName.length > 100) {
      throw new Error('Budget name cannot exceed 100 characters');
    }
    this._name = newName.trim();
  }

  public updateAmount(newAmount: number): void {
    if (newAmount <= 0) {
      throw new Error('Budget amount must be greater than zero');
    }
    this._amount = newAmount;
  }

  public updateCurrency(newCurrency: string): void {
    if (!newCurrency || newCurrency.length !== 3) {
      throw new Error('Currency must be a valid ISO 4217 code (3 characters)');
    }
    this._currency = newCurrency.toUpperCase();
  }

  public updatePeriod(newPeriod: BudgetPeriod): void {
    const validPeriods: BudgetPeriod[] = ['monthly', 'yearly'];
    if (!validPeriods.includes(newPeriod)) {
      throw new Error('Invalid period. Must be: monthly or yearly');
    }
    this._period = newPeriod;
  }

  public updateCategoryId(categoryId?: string | null): void {
    this._categoryId = categoryId ?? null;
  }

  public updateSubscriptionIds(ids: string[]): void {
    this._subscriptionIds = [...ids];
  }

  public updateDates(startDate: Date, endDate?: Date | null): void {
    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
    this._startDate = startDate;
    this._endDate = endDate ?? null;
  }

  public updateNotes(notes?: string): void {
    this._notes = notes?.trim();
  }

  public activate(): void {
    this._isActive = true;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public belongsToUser(userId: string): boolean {
    return this._userId === userId;
  }

  public computeEndDate(): Date {
    if (this._endDate) {
      return this._endDate;
    }
    const end = new Date(this._startDate);
    if (this._period === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }

  public toJSON(): BudgetProps {
    return {
      id: this._id,
      userId: this._userId,
      categoryId: this._categoryId,
      subscriptionIds: this._subscriptionIds,
      name: this._name,
      amount: this._amount,
      currency: this._currency,
      period: this._period,
      startDate: this._startDate,
      endDate: this._endDate,
      isActive: this._isActive,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
