import { RoleLimit } from './role-limit.entity';

/**
 * RoleLimit Repository Interface (Port)
 * Defines the contract that the infrastructure must implement
 */
export interface IRoleLimitRepository {
  /**
   * Find a role limit by role key
   */
  findByRole(role: string): Promise<RoleLimit | null>;

  /**
   * Save a role limit (create or update)
   */
  save(roleLimit: RoleLimit): Promise<RoleLimit>;

  /**
   * Delete a role limit by role key
   */
  delete(role: string): Promise<void>;

  /**
   * Find all role limits
   */
  findAll(): Promise<RoleLimit[]>;

  /**
   * Count role limits
   */
  count(): Promise<number>;

  /**
   * Check if a role limit exists for a role
   */
  roleExists(role: string): Promise<boolean>;
}

// Injection token for NestJS
export const ROLE_LIMIT_REPOSITORY = Symbol('ROLE_LIMIT_REPOSITORY');
