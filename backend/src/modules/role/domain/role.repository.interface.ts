import { Role } from './role.entity';

/**
 * Role Repository Interface (Port)
 * Defines the contract that the infrastructure must implement
 */
export interface IRoleRepository {
  /**
   * Find a role by its key
   */
  findByKey(key: string): Promise<Role | null>;

  /**
   * Save a role (create or update)
   */
  save(role: Role): Promise<Role>;

  /**
   * Delete a role by key
   */
  delete(key: string): Promise<void>;

  /**
   * Find all roles
   */
  findAll(): Promise<Role[]>;

  /**
   * Count roles
   */
  count(): Promise<number>;

  /**
   * Check if a role key exists
   */
  keyExists(key: string): Promise<boolean>;
}

// Injection token for NestJS
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
