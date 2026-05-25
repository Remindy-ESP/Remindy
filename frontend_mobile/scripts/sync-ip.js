#!/usr/bin/env node
/**
 * Auto-detects the Mac's current LAN IP and updates EXPO_PUBLIC_BACKEND_API_URL
 * in .env.local so the iPhone can always reach the backend regardless of WiFi network.
 *
 * Runs automatically before `npm run ios` and `npm start`.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const PORT = 3000;

function getLanIp() {
  try {
    // macOS: try en0 (WiFi) first, fallback to en1 (Ethernet)
    const ip = execSync('ipconfig getifaddr en0 || ipconfig getifaddr en1', {
      encoding: 'utf-8',
    }).trim();
    if (!ip) throw new Error('No LAN IP detected on en0 or en1');
    return ip;
  } catch (err) {
    console.error('❌ Could not detect LAN IP:', err.message);
    console.error('   Make sure you are connected to WiFi or Ethernet.');
    process.exit(1);
  }
}

function updateEnvFile(ip) {
  const newUrl = `EXPO_PUBLIC_BACKEND_API_URL=http://${ip}:${PORT}`;
  let content = '';

  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf-8');
    if (content.match(/^EXPO_PUBLIC_BACKEND_API_URL=.*$/m)) {
      content = content.replace(/^EXPO_PUBLIC_BACKEND_API_URL=.*$/m, newUrl);
    } else {
      content += content.endsWith('\n') ? newUrl + '\n' : '\n' + newUrl + '\n';
    }
  } else {
    console.warn('⚠️  .env.local not found, creating it with API URL only.');
    content = `${newUrl}\n`;
  }

  fs.writeFileSync(ENV_FILE, content);
  console.log(`✅ Synced backend URL → http://${ip}:${PORT}`);
}

const ip = getLanIp();
updateEnvFile(ip);
