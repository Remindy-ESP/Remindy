import { Folder } from '../../domain/folder.entity';

/**
 * Interface du repository Folder (port)
 * Définit les opérations de persistence pour les dossiers
 */
export interface IFolderRepository {
  /**
   * Sauvegarder un dossier (create ou update)
   */
  save(folder: Folder): Promise<Folder>;

  /**
   * Trouver un dossier par ID
   */
  findById(id: string): Promise<Folder | null>;

  /**
   * Trouver tous les dossiers d'un utilisateur
   */
  findByUserId(userId: string, includeDeleted?: boolean): Promise<Folder[]>;

  /**
   * Trouver les dossiers racine d'un utilisateur (sans parent)
   */
  findRootFoldersByUserId(userId: string): Promise<Folder[]>;

  /**
   * Trouver les sous-dossiers d'un dossier parent
   */
  findSubfolders(parentId: string): Promise<Folder[]>;

  /**
   * Trouver un dossier par nom et userId
   */
  findByNameAndUserId(name: string, userId: string): Promise<Folder | null>;

  /**
   * Trouver les dossiers par défaut d'un utilisateur
   */
  findDefaultFoldersByUserId(userId: string): Promise<Folder[]>;

  /**
   * Supprimer un dossier (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete d'un dossier
   */
  softDelete(id: string): Promise<void>;

  /**
   * Restaurer un dossier supprimé
   */
  restore(id: string): Promise<void>;

  /**
   * Compter le nombre de documents dans un dossier
   */
  countDocumentsInFolder(folderId: string): Promise<number>;

  /**
   * Vérifier si un dossier existe
   */
  exists(id: string): Promise<boolean>;

  /**
   * Vérifier si un dossier appartient à un utilisateur
   */
  belongsToUser(folderId: string, userId: string): Promise<boolean>;
}

export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');
