export interface EventSeriesProps {
  id?: string;
  subscriptionId: string;
  rrule: string;
  dtstart: Date;
  timezone: string;
  exdates?: Date[];
  rdates?: Date[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class EventSeries {
  private _id?: string;
  private _subscriptionId: string;
  private _rrule: string;
  private _dtstart: Date;
  private _timezone: string;
  private _exdates?: Date[];
  private _rdates?: Date[];
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: EventSeriesProps) {
    this._id = props.id;
    this._subscriptionId = props.subscriptionId;
    this._rrule = this.normalizeRRule(props.rrule);
    this._dtstart = props.dtstart;
    this._timezone = props.timezone || 'Europe/Paris';
    this._exdates = props.exdates;
    this._rdates = props.rdates;
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

  get rrule(): string {
    return this._rrule;
  }

  get dtstart(): Date {
    return this._dtstart;
  }

  get timezone(): string {
    return this._timezone;
  }

  get exdates(): Date[] | undefined {
    return this._exdates;
  }

  get rdates(): Date[] | undefined {
    return this._rdates;
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
    if (!this._subscriptionId || this._subscriptionId.trim().length === 0) {
      throw new Error('Subscription ID is required');
    }

    if (!this._rrule || this._rrule.trim().length === 0) {
      throw new Error('RRULE is required');
    }

    if (!this._dtstart) {
      throw new Error('Start date (dtstart) is required');
    }

    // Validate RRULE format (basic check)
    if (!this._rrule.toUpperCase().startsWith('FREQ=')) {
      throw new Error('RRULE must start with FREQ=');
    }

    // Validate timezone
    if (!this._timezone || this._timezone.trim().length === 0) {
      throw new Error('Timezone is required');
    }
  }

  // Normalize RRULE to uppercase for consistency
  private normalizeRRule(rrule: string): string {
    return rrule.trim().toUpperCase();
  }

  // Business logic methods
  public updateRRule(rrule: string): void {
    if (!rrule || rrule.trim().length === 0) {
      throw new Error('RRULE is required');
    }
    this._rrule = this.normalizeRRule(rrule);
    this.validate();
  }

  public updateDtstart(dtstart: Date): void {
    if (!dtstart) {
      throw new Error('Start date (dtstart) is required');
    }
    this._dtstart = dtstart;
  }

  public updateTimezone(timezone: string): void {
    if (!timezone || timezone.trim().length === 0) {
      throw new Error('Timezone is required');
    }
    this._timezone = timezone;
  }

  public addExceptionDate(date: Date): void {
    if (!this._exdates) {
      this._exdates = [];
    }
    // Avoid duplicates
    if (!this._exdates.some(d => d.getTime() === date.getTime())) {
      this._exdates.push(date);
    }
  }

  public removeExceptionDate(date: Date): void {
    if (this._exdates) {
      this._exdates = this._exdates.filter(d => d.getTime() !== date.getTime());
    }
  }

  public addRecurrenceDate(date: Date): void {
    if (!this._rdates) {
      this._rdates = [];
    }
    // Avoid duplicates
    if (!this._rdates.some(d => d.getTime() === date.getTime())) {
      this._rdates.push(date);
    }
  }

  public removeRecurrenceDate(date: Date): void {
    if (this._rdates) {
      this._rdates = this._rdates.filter(d => d.getTime() !== date.getTime());
    }
  }

  public toJSON() {
    return {
      id: this._id,
      subscriptionId: this._subscriptionId,
      rrule: this._rrule,
      dtstart: this._dtstart,
      timezone: this._timezone,
      exdates: this._exdates,
      rdates: this._rdates,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
