import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Service de cache générique pour toute l'application
 * Fournit des méthodes utilitaires pour gérer le cache Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Récupère une valeur du cache
   * @param key Clé du cache
   * @returns Valeur ou null si non trouvée
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT: ${key}`);
        return value;
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Définit une valeur dans le cache
   * @param key Clé du cache
   * @param value Valeur à stocker
   * @param ttlSeconds TTL en secondes (optionnel)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttlMs = ttlSeconds ? ttlSeconds * 1000 : undefined;
      await this.cacheManager.set(key, value, ttlMs);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds ? ttlSeconds + 's' : 'default'})`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Supprime une clé du cache
   * @param key Clé à supprimer
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Supprime toutes les clés du cache
   * Note: La méthode reset() n'est pas disponible dans cache-manager v7+
   * Pour vider le cache, utilisez Redis CLI: FLUSHDB
   */
  reset(): void {
    this.logger.warn('Cache RESET: Not implemented in cache-manager v7. Use Redis CLI: FLUSHDB');
    // La méthode reset() n'existe plus dans cache-manager v7
    // Alternative: utiliser Redis CLI directement ou supprimer les clés par pattern
  }

  /**
   * Wrapper pratique pour le pattern Cache-Aside
   * Récupère du cache ou exécute la factory et met en cache
   *
   * @param key Clé du cache
   * @param factory Fonction pour générer la valeur si absente du cache
   * @param ttlSeconds TTL en secondes
   * @returns Valeur (du cache ou générée)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    // 1. Essayer de récupérer du cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Si absent, exécuter la factory
    try {
      const fresh = await factory();

      // 3. Mettre en cache
      await this.set(key, fresh, ttlSeconds);

      return fresh;
    } catch (error) {
      this.logger.error(`Error in getOrSet factory for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Wrapper pour les opérations avec multi-key
   * Récupère plusieurs valeurs du cache en une seule opération
   *
   * @param keys Tableau de clés
   * @returns Map avec les valeurs trouvées
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    try {
      await Promise.all(
        keys.map(async key => {
          const value = await this.get<T>(key);
          if (value !== null) {
            results.set(key, value);
          }
        }),
      );
    } catch (error) {
      this.logger.error('Error in mget:', error);
    }

    return results;
  }

  /**
   * Définit plusieurs valeurs dans le cache
   *
   * @param entries Map de clé-valeur
   * @param ttlSeconds TTL en secondes
   */
  async mset<T>(entries: Map<string, T>, ttlSeconds?: number): Promise<void> {
    try {
      await Promise.all(
        Array.from(entries.entries()).map(([key, value]) => this.set(key, value, ttlSeconds)),
      );
    } catch (error) {
      this.logger.error('Error in mset:', error);
    }
  }

  /**
   * Supprime plusieurs clés du cache
   *
   * @param keys Tableau de clés à supprimer
   */
  async mdel(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.del(key)));
    } catch (error) {
      this.logger.error('Error in mdel:', error);
    }
  }

  /**
   * Génère une clé de cache standardisée
   * Format: entity:id ou entity:field:value
   *
   * @param parts Parties de la clé
   * @returns Clé formatée
   */
  buildKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }

  /**
   * Wrap une fonction avec un cache automatique
   * Utile pour les décorateurs ou les HOF
   *
   * @param keyGenerator Fonction pour générer la clé de cache
   * @param fn Fonction à wrapper
   * @param ttlSeconds TTL en secondes
   */
  wrap<TArgs extends any[], TResult>(
    keyGenerator: (...args: TArgs) => string,
    fn: (...args: TArgs) => Promise<TResult>,
    ttlSeconds = 3600,
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), ttlSeconds);
    };
  }
}
