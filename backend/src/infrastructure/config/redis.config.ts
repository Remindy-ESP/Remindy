import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

/**
 * Configuration Redis pour le cache distribué
 * Utilise Keyv comme adapter pour cache-manager v7+
 */
export const redisConfig: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = configService.get<string>('REDIS_PASSWORD');
    const redisTls = configService.get<boolean>('REDIS_TLS', false);

    // Construire l'URL de connexion Redis
    let connectionUrl: string;
    if (redisUrl) {
      connectionUrl = redisUrl;
    } else {
      const protocol = redisTls ? 'rediss' : 'redis';
      const auth = redisPassword ? `:${redisPassword}@` : '';
      connectionUrl = `${protocol}://${auth}${redisHost}:${redisPort}`;
    }

    // Configuration du store Keyv avec Redis
    // KeyvRedis accepte soit une URL string, soit un objet d'options limité
    const keyvRedis = new KeyvRedis(connectionUrl);

    const keyv = new Keyv({
      store: keyvRedis,
      // TTL par défaut: 1 heure
      ttl: configService.get<number>('CACHE_TTL', 3600000),
      // Namespace pour éviter les collisions de clés
      namespace: configService.get<string>('CACHE_NAMESPACE', 'remindy'),
    });

    // Gestion des erreurs de connexion
    keyv.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    return {
      store: keyv,
      // TTL global en millisecondes
      ttl: configService.get<number>('CACHE_TTL', 3600000),
    };
  },
};
