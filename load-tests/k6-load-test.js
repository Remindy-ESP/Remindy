import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');
const cacheHitRate = new Rate('cache_hits');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');
const totalRequests = new Counter('total_requests');

// Configuration du test de charge
export const options = {
  stages: [
    // Warmup - Réchauffement du cache
    { duration: '1m', target: 50 },

    // Ramp up - Montée en charge
    { duration: '2m', target: 100 },

    // Sustained load - 6000 req/min
    { duration: '5m', target: 100 },

    // Peak load - 10k req/min
    { duration: '1m', target: 167 },

    // Sustain peak
    { duration: '2m', target: 167 },

    // Cool down
    { duration: '1m', target: 0 },
  ],

  // Seuils de performance
  thresholds: {
    // Latence
    'http_req_duration': [
      'p(95)<500',    // 95% des requêtes < 500ms
      'p(99)<1000',   // 99% des requêtes < 1s
    ],

    // Erreurs
    'errors': ['rate<0.01'],              // Moins de 1% d'erreurs
    'http_req_failed': ['rate<0.01'],     // Moins de 1% d'échecs HTTP

    // Métriques spécifiques
    'login_duration': ['p(95)<300'],      // Login rapide
    'api_duration': ['p(95)<200'],        // API très rapide (cache hit)
  },
};

const BASE_URL = 'http://localhost:8080';

// Données de test
const TEST_USER = {
  email: 'loadtest@example.com',
  password: 'Test123!LoadTest',
};

/**
 * Fonction de setup - Exécutée une seule fois au début
 * Crée l'utilisateur de test si nécessaire
 */
export function setup() {
  console.log('🚀 Setup: Création de l\'utilisateur de test...');

  const registerPayload = JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
    name: 'Load Test User',
  });

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    registerPayload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerRes.status === 201 || registerRes.status === 409) {
    console.log('✅ Utilisateur de test prêt');
    return { userCreated: true };
  } else {
    console.log('⚠️  Erreur lors de la création de l\'utilisateur de test');
    return { userCreated: false };
  }
}

/**
 * Fonction principale - Exécutée par chaque VU (Virtual User)
 */
export default function() {
  totalRequests.add(1);

  // Scénario 1: Login + requêtes authentifiées (70% des users)
  if (Math.random() < 0.7) {
    authenticatedUserFlow();
  }
  // Scénario 2: Refresh token flow (20% des users)
  else if (Math.random() < 0.9) {
    refreshTokenFlow();
  }
  // Scénario 3: Lectures multiples pour tester le cache (10% des users)
  else {
    cacheTestFlow();
  }

  // Think time - Temps de réflexion entre les requêtes
  sleep(Math.random() * 3);
}

/**
 * Scénario 1: Flux utilisateur authentifié complet
 */
function authenticatedUserFlow() {
  // 1. Login
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login succeeded': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
    'has refresh token': (r) => r.json('refreshToken') !== undefined,
  });

  loginDuration.add(Date.now() - loginStart);
  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    return;
  }

  const accessToken = loginRes.json('accessToken');
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 2. Récupérer les subscriptions
  const subsStart = Date.now();
  const subsRes = http.get(`${BASE_URL}/subscriptions`, authHeaders);
  apiDuration.add(Date.now() - subsStart);

  check(subsRes, {
    'subscriptions fetched': (r) => r.status === 200,
  });

  // 3. Récupérer les événements
  const eventsStart = Date.now();
  const eventsRes = http.get(`${BASE_URL}/events`, authHeaders);
  apiDuration.add(Date.now() - eventsStart);

  check(eventsRes, {
    'events fetched': (r) => r.status === 200,
  });

  // 4. Récupérer les catégories (devrait être en cache)
  const catStart = Date.now();
  const catRes = http.get(`${BASE_URL}/categories`, authHeaders);
  apiDuration.add(Date.now() - catStart);

  const catCheck = check(catRes, {
    'categories fetched': (r) => r.status === 200,
  });

  // Supposer que si la réponse est rapide, c'est un cache hit
  if (catCheck && (Date.now() - catStart) < 50) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }

  // 5. Récupérer le profil utilisateur
  const profileStart = Date.now();
  const profileRes = http.get(`${BASE_URL}/users/me`, authHeaders);
  apiDuration.add(Date.now() - profileStart);

  check(profileRes, {
    'profile fetched': (r) => r.status === 200,
  });
}

/**
 * Scénario 2: Refresh token flow
 * Test du cache de session
 */
function refreshTokenFlow() {
  // 1. Login pour obtenir le refresh token
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200) {
    errorRate.add(1);
    return;
  }

  const refreshToken = loginRes.json('refreshToken');

  sleep(1); // Attendre un peu

  // 2. Refresh du token (teste le cache de session)
  const refreshStart = Date.now();
  const refreshRes = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refreshToken }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const refreshSuccess = check(refreshRes, {
    'token refreshed': (r) => r.status === 200,
    'has new access token': (r) => r.json('accessToken') !== undefined,
  });

  // Si le refresh est rapide, le cache de session fonctionne
  if (refreshSuccess && (Date.now() - refreshStart) < 50) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }

  errorRate.add(!refreshSuccess);

  if (!refreshSuccess) {
    return;
  }

  // 3. Utiliser le nouveau token
  const newToken = refreshRes.json('accessToken');
  const subsRes = http.get(`${BASE_URL}/subscriptions`, {
    headers: { 'Authorization': `Bearer ${newToken}` },
  });

  check(subsRes, {
    'data fetched with new token': (r) => r.status === 200,
  });
}

/**
 * Scénario 3: Lectures multiples
 * Teste intensivement le cache
 */
function cacheTestFlow() {
  // Login une seule fois
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status !== 200) {
    errorRate.add(1);
    return;
  }

  const accessToken = loginRes.json('accessToken');
  const authHeaders = {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  };

  // Faire 10 requêtes répétées pour tester le cache
  for (let i = 0; i < 10; i++) {
    const start = Date.now();

    const res = http.get(`${BASE_URL}/categories`, authHeaders);
    const duration = Date.now() - start;

    apiDuration.add(duration);

    const success = check(res, {
      'cache read successful': (r) => r.status === 200,
    });

    // Si très rapide, c'est probablement un cache hit
    if (success && duration < 30) {
      cacheHitRate.add(1);
    } else {
      cacheHitRate.add(0);
    }

    sleep(0.1); // Petit délai entre les lectures
  }
}

/**
 * Fonction de teardown - Exécutée à la fin
 */
export function teardown(data) {
  console.log('🏁 Test de charge terminé');
  console.log(`📊 Utilisateur de test créé: ${data.userCreated}`);
}

/**
 * Fonction handleSummary - Personnalise le rapport final
 */
export function handleSummary(data) {
  console.log('\n📈 RÉSUMÉ DES PERFORMANCES\n');
  console.log(`Total de requêtes: ${data.metrics.http_reqs.values.count}`);
  console.log(`Taux d'erreur: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`Cache hit rate: ${(data.metrics.cache_hits.values.rate * 100).toFixed(2)}%`);
  console.log(`\nLatence (ms):`);
  console.log(`  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`\nLogin duration (ms):`);
  console.log(`  p95: ${data.metrics.login_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`\nAPI duration (ms):`);
  console.log(`  p95: ${data.metrics.api_duration.values['p(95)'].toFixed(2)}ms`);

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
