import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { UserSessionEntity } from '../../../../infrastructure/database/entities/user-session.entity';

/**
 * Service de cache pour les sessions utilisateur
 * Réduit la charge sur la base de données en cachant les sessions actives
 */
@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);

  // TTL par défaut: 24 heures (en secondes)
  private readonly DEFAULT_SESSION_TTL = 24 * 60 * 60;

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Génère la clé de cache pour une session
   * Format: session:token:{hash}
   */
  private getSessionKey(tokenHash: string): string {
    return this.cacheService.buildKey('session', 'token', tokenHash);
  }

  /**
   * Génère la clé de cache pour toutes les sessions d'un utilisateur
   * Format: session:user:{userId}:sessions
   */
  private getUserSessionsKey(userId: number): string {
    return this.cacheService.buildKey('session', 'user', userId, 'sessions');
  }

  /**
   * Met une session en cache
   * Le TTL est calculé en fonction de la date d'expiration de la session
   *
   * @param session Session à cacher
   */
  async cacheSession(session: UserSessionEntity): Promise<void> {
    if (!session || !session.refreshTokenHash) {
      this.logger.warn('Attempted to cache invalid session');
      return;
    }

    const key = this.getSessionKey(session.refreshTokenHash);

    // Calculer le TTL basé sur l'expiration de la session
    const ttlSeconds = session.expiresAt
      ? Math.max(Math.floor((session.expiresAt.getTime() - Date.now()) / 1000), 0)
      : this.DEFAULT_SESSION_TTL;

    // Ne pas cacher les sessions déjà expirées
    if (ttlSeconds <= 0) {
      this.logger.debug(`Session ${session.id} already expired, not caching`);
      return;
    }

    await this.cacheService.set(key, session, ttlSeconds);
    this.logger.debug(
      `Cached session ${session.id} for user ${session.userId} (TTL: ${ttlSeconds}s)`,
    );
  }

  /**
   * Récupère une session du cache
   *
   * @param tokenHash Hash du refresh token
   * @returns Session ou null si non trouvée
   */
  async getSession(tokenHash: string): Promise<UserSessionEntity | null> {
    if (!tokenHash) {
      return null;
    }

    const key = this.getSessionKey(tokenHash);
    const session = await this.cacheService.get<UserSessionEntity>(key);

    if (session) {
      this.logger.debug(`Cache HIT for session with token hash`);
      // Vérifier que la session n'est pas révoquée
      if (session.isRevoked) {
        this.logger.debug(`Session is revoked, removing from cache`);
        await this.invalidateSession(tokenHash);
        return null;
      }
      return session;
    }

    this.logger.debug(`Cache MISS for session with token hash`);
    return null;
  }

  /**
   * Invalide une session du cache
   *
   * @param tokenHash Hash du refresh token
   */
  async invalidateSession(tokenHash: string): Promise<void> {
    if (!tokenHash) {
      return;
    }

    const key = this.getSessionKey(tokenHash);
    await this.cacheService.del(key);
    this.logger.debug(`Invalidated session cache for token hash`);
  }

  /**
   * Invalide toutes les sessions d'un utilisateur
   * Note: Cette méthode supprime également la liste des sessions de l'utilisateur
   *
   * @param userId ID de l'utilisateur
   * @param tokenHashes Liste des hashs de tokens à invalider
   */
  async invalidateUserSessions(userId: number, tokenHashes: string[]): Promise<void> {
    if (!userId || !tokenHashes || tokenHashes.length === 0) {
      return;
    }

    const keys = tokenHashes.map(hash => this.getSessionKey(hash));
    const userSessionsKey = this.getUserSessionsKey(userId);
    keys.push(userSessionsKey);

    await this.cacheService.mdel(keys);
    this.logger.debug(`Invalidated ${tokenHashes.length} sessions for user ${userId}`);
  }

  /**
   * Met à jour une session dans le cache
   * Utile lorsque l'activité de l'utilisateur est mise à jour
   *
   * @param session Session mise à jour
   */
  async updateSession(session: UserSessionEntity): Promise<void> {
    // Réutilise la logique de cacheSession pour mettre à jour
    await this.cacheSession(session);
  }

  /**
   * Vérifie si une session existe dans le cache
   *
   * @param tokenHash Hash du refresh token
   * @returns true si la session est en cache
   */
  async hasSession(tokenHash: string): Promise<boolean> {
    const session = await this.getSession(tokenHash);
    return session !== null;
  }

  /**
   * Cache plusieurs sessions en une seule opération
   *
   * @param sessions Sessions à cacher
   */
  async cacheSessions(sessions: UserSessionEntity[]): Promise<void> {
    if (!sessions || sessions.length === 0) {
      return;
    }

    await Promise.all(sessions.map(session => this.cacheSession(session)));
    this.logger.debug(`Cached ${sessions.length} sessions`);
  }
}
