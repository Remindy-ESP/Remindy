/**
 * RoleLimit Domain Entity
 */
export class RoleLimit {
  private role: string;
  private maxSubscriptions: number | null;
  private maxDocuments: number | null;
  private maxDocumentSizeMb: number | null;
  private maxRemindersPerSubscription: number | null;
  private canExportData: boolean;
  private canUseOcr: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(props: {
    role: string;
    maxSubscriptions?: number | null;
    maxDocuments?: number | null;
    maxDocumentSizeMb?: number | null;
    maxRemindersPerSubscription?: number | null;
    canExportData?: boolean;
    canUseOcr?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.role = props.role;
    this.maxSubscriptions = props.maxSubscriptions ?? null;
    this.maxDocuments = props.maxDocuments ?? null;
    this.maxDocumentSizeMb = props.maxDocumentSizeMb ?? null;
    this.maxRemindersPerSubscription = props.maxRemindersPerSubscription ?? null;
    this.canExportData = props.canExportData ?? true;
    this.canUseOcr = props.canUseOcr ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  getRole(): string {
    return this.role;
  }

  getMaxSubscriptions(): number | null {
    return this.maxSubscriptions;
  }

  getMaxDocuments(): number | null {
    return this.maxDocuments;
  }

  getMaxDocumentSizeMb(): number | null {
    return this.maxDocumentSizeMb;
  }

  getMaxRemindersPerSubscription(): number | null {
    return this.maxRemindersPerSubscription;
  }

  canExport(): boolean {
    return this.canExportData;
  }

  canOcr(): boolean {
    return this.canUseOcr;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  hasUnlimitedSubscriptions(): boolean {
    return this.maxSubscriptions === null;
  }

  hasUnlimitedDocuments(): boolean {
    return this.maxDocuments === null;
  }
}
