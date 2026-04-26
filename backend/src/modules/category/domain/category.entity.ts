export interface CategoryProps {
  id?: string;
  name: string;
  icon: string;
  color: string;
  userId?: string | null;
  isSystem?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Category {
  private readonly _id?: string;
  private _name: string;
  private _icon: string;
  private _color: string;
  private readonly _userId?: string | null;
  private readonly _isSystem: boolean;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: CategoryProps) {
    this._id = props.id;
    this._name = props.name;
    this._icon = props.icon;
    this._color = props.color;
    this._userId = props.userId;
    this._isSystem = props.isSystem ?? false;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get icon(): string {
    return this._icon;
  }

  get color(): string {
    return this._color;
  }

  get userId(): string | null | undefined {
    return this._userId;
  }

  get isSystem(): boolean {
    return this._isSystem;
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
      throw new Error('Category name cannot be empty');
    }

    if (this._name.length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }

    if (!this._icon || this._icon.trim().length === 0) {
      throw new Error('Category icon cannot be empty');
    }

    if (this._icon.length > 50) {
      throw new Error('Category icon cannot exceed 50 characters');
    }

    if (!this._color || !/^#[0-9A-Fa-f]{6}$/.test(this._color)) {
      throw new Error('Color must be a valid HEX color code (e.g., #FF5733)');
    }
  }

  public updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (newName.length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }
    this._name = newName.trim();
  }

  public updateIcon(newIcon: string): void {
    if (!newIcon || newIcon.trim().length === 0) {
      throw new Error('Category icon cannot be empty');
    }
    if (newIcon.length > 50) {
      throw new Error('Category icon cannot exceed 50 characters');
    }
    this._icon = newIcon.trim();
  }

  public updateColor(newColor: string): void {
    if (!newColor || !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      throw new Error('Color must be a valid HEX color code (e.g., #FF5733)');
    }
    this._color = newColor;
  }

  public isSystemCategory(): boolean {
    return this._isSystem;
  }

  public canBeDeleted(): boolean {
    return !this._isSystem;
  }

  public canBeModifiedBy(userId: string): boolean {
    if (this._isSystem) {
      return false;
    }
    return this._userId === userId;
  }

  public belongsToUser(userId: string): boolean {
    return this._userId === userId;
  }

  public toJSON(): CategoryProps {
    return {
      id: this._id,
      name: this._name,
      icon: this._icon,
      color: this._color,
      userId: this._userId,
      isSystem: this._isSystem,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
