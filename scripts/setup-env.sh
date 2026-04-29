#!/bin/bash
# setup-env.sh — Génère frontend_mobile/.env avec l'IP locale détectée automatiquement.
# Usage : bash scripts/setup-env.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MOBILE_ENV="$ROOT_DIR/frontend_mobile/.env"

# --- Détection de l'IP locale ---
OS="$(uname -s)"
LOCAL_IP=""

case "$OS" in
  Linux*)
    LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')
    ;;
  Darwin*)
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null)
    if [ -z "$LOCAL_IP" ]; then
      LOCAL_IP=$(ipconfig getifaddr en1 2>/dev/null)
    fi
    ;;
  *)
    echo "OS non reconnu ($OS). Utilise scripts/setup-env.ps1 sous Windows."
    exit 1
    ;;
esac

if [ -z "$LOCAL_IP" ]; then
  echo "Impossible de détecter l'IP locale."
  echo "Renseigne EXPO_PUBLIC_BACKEND_API_URL manuellement dans frontend_mobile/.env"
  exit 1
fi

# --- Écriture du .env mobile ---
cat > "$MOBILE_ENV" <<EOF
EXPO_PUBLIC_BACKEND_API_URL=http://${LOCAL_IP}:3000
EXPO_PUBLIC_BACKEND_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=local
EOF

echo "frontend_mobile/.env mis à jour → http://${LOCAL_IP}:3000"
