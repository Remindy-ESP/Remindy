import { User } from './user.entity';

/**
 * User Repository Interface (Port)
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface IUserRepository {
  /**
   * Trouve un user par son ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Trouve un user par son email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Sauvegarde un user (create ou update)
   */
  save(user: User): Promise<User>;

  /**
   * Supprime définitivement un user (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Trouve tous les users avec pagination
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    includeDeleted?: boolean;
  }): Promise<{ users: User[]; total: number }>;

  /**
   * Compte le nombre de users
   */
  count(options?: { includeDeleted?: boolean }): Promise<number>;

  /**
   * Vérifie si un email existe déjà
   */
  emailExists(email: string, excludeUserId?: string): Promise<boolean>;
}

// Token d'injection pour NestJS
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
