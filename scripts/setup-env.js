#!/usr/bin/env node
/**
 * setup-env.js — Génère frontend_mobile/.env avec l'IP locale détectée automatiquement.
 * Fonctionne sur Linux, macOS et Windows sans dépendance externe.
 * Usage : node scripts/setup-env.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MOBILE_ENV = path.join(ROOT_DIR, 'frontend_mobile', '.env');

// --- Détection de l'IP locale ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  // Ordre de préférence des interfaces réseau courantes
  const preferred = ['en0', 'en1', 'eth0', 'eth1', 'wlan0', 'Wi-Fi', 'Ethernet'];

  // 1. Chercher d'abord dans les interfaces préférées
  for (const name of preferred) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }

  // 2. Fallback : parcourir toutes les interfaces
  for (const [, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }

  return null;
}

const localIP = getLocalIP();

if (!localIP) {
  console.error('Impossible de détecter l\'IP locale.');
  console.error('Renseigne EXPO_PUBLIC_BACKEND_API_URL manuellement dans frontend_mobile/.env');
  process.exit(1);
}

// --- Écriture du .env mobile ---
const content = `EXPO_PUBLIC_BACKEND_API_URL=http://${localIP}:3000
EXPO_PUBLIC_BACKEND_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=local
`;

fs.writeFileSync(MOBILE_ENV, content, 'utf8');
console.log(`frontend_mobile/.env mis à jour → http://${localIP}:3000`);