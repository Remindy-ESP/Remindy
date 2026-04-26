/**
 * Folder Domain Entity
 * Représente un dossier dans le domaine métier
 */
export class Folder {
  private _id?: string;
  private _userId: string;
  private _name: string;
  private _parentId?: string;
  private _color?: string;
  private _icon?: string;
  private _isDefault: boolean;
  private _createdAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: {
    id?: string;
    userId: string;
    name: string;
    parentId?: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    this._id = props.id;
    this._userId = props.userId;
    this._name = props.name;
    this._parentId = props.parentId;
    this._color = props.color;
    this._icon = props.icon;
    this._isDefault = props.isDefault || false;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  // === Validation ===
  private validate(): void {
    if (!this._userId || this._userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!this._name || this._name.trim() === '') {
      throw new Error('Folder name is required');
    }

    if (this._name.length > 255) {
      throw new Error('Folder name is too long (max 255 characters)');
    }

    // Valider le format de couleur hex si présent
    if (this._color && !/^#[0-9A-Fa-f]{6}$/.test(this._color)) {
      throw new Error('Invalid color format (expected #RRGGBB)');
    }
  }

  // === Business Logic ===

  /**
   * Renommer le dossier
   */
  public rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('Folder name cannot be empty');
    }

    if (newName.length > 255) {
      throw new Error('Folder name is too long (max 255 characters)');
    }

    this._name = newName.trim();
    this._updatedAt = new Date();
  }

  /**
   * Changer la couleur du dossier
   */
  public changeColor(color: string): void {
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Invalid color format (expected #RRGGBB)');
    }

    this._color = color;
    this._updatedAt = new Date();
  }

  /**
   * Changer l'icône du dossier
   */
  public changeIcon(icon: string): void {
    this._icon = icon;
    this._updatedAt = new Date();
  }

  /**
   * Déplacer dans un autre dossier parent
   */
  public moveTo(parentId?: string): void {
    // Empêcher la création de boucles (un dossier ne peut pas être son propre parent)
    if (parentId && this._id && parentId === this._id) {
      throw new Error('A folder cannot be its own parent');
    }

    this._parentId = parentId;
    this._updatedAt = new Date();
  }

  /**
   * Soft delete du dossier
   */
  public softDelete(): void {
    if (this._isDefault) {
      throw new Error('Cannot delete a default folder');
    }

    this._deletedAt = new Date();
  }

  /**
   * Restaurer un dossier supprimé
   */
  public restore(): void {
    this._deletedAt = undefined;
  }

  /**
   * Vérifier si le dossier est supprimé
   */
  public isDeleted(): boolean {
    return this._deletedAt !== undefined && this._deletedAt !== null;
  }

  /**
   * Vérifier si c'est un dossier racine (pas de parent)
   */
  public isRoot(): boolean {
    return !this._parentId;
  }

  /**
   * Vérifier si c'est un sous-dossier
   */
  public isSubfolder(): boolean {
    return !!this._parentId;
  }

  // === Getters ===
  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }

  get color(): string | undefined {
    return this._color;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get isDefault(): boolean {
    return this._isDefault;
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

  // === Factory Methods ===

  /**
   * Créer un dossier par défaut
   */
  static createDefault(userId: string, name: string, icon?: string, color?: string): Folder {
    return new Folder({
      userId,
      name,
      icon,
      color,
      isDefault: true,
    });
  }

  /**
   * Créer un dossier utilisateur standard
   */
  static create(userId: string, name: string, parentId?: string): Folder {
    return new Folder({
      userId,
      name,
      parentId,
      isDefault: false,
    });
  }

  /**
   * Créer un sous-dossier
   */
  static createSubfolder(userId: string, name: string, parentId: string): Folder {
    if (!parentId) {
      throw new Error('Parent ID is required for subfolder');
    }

    return new Folder({
      userId,
      name,
      parentId,
      isDefault: false,
    });
  }
}
