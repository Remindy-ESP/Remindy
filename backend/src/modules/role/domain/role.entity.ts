/**
 * Role Domain Entity
 */
export class Role {
  private key: string;
  private label: string;
  private description: string | null;
  private createdAt: Date;

  constructor(props: {
    key: string;
    label: string;
    description?: string | null;
    createdAt?: Date;
  }) {
    this.key = props.key;
    this.label = props.label;
    this.description = props.description ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  getKey(): string {
    return this.key;
  }

  getLabel(): string {
    return this.label;
  }

  getDescription(): string | null {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  updateLabel(label: string): void {
    if (!label || label.trim().length === 0) {
      throw new Error('Label cannot be empty');
    }
    this.label = label;
  }

  updateDescription(description: string | null): void {
    this.description = description;
  }
}
