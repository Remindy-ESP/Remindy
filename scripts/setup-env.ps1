# setup-env.ps1 — Génère frontend_mobile/.env avec l'IP locale détectée automatiquement.
# Usage : powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1

$RootDir = Split-Path -Parent $PSScriptRoot
$MobileEnv = Join-Path $RootDir "frontend_mobile\.env"

# --- Détection de l'IP locale (première interface avec une route par défaut) ---
try {
    $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction Stop |
                    Sort-Object RouteMetric |
                    Select-Object -First 1
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.ifIndex -ErrorAction Stop).IPAddress
} catch {
    Write-Error "Impossible de détecter l'IP locale : $_"
    Write-Host "Renseigne EXPO_PUBLIC_BACKEND_API_URL manuellement dans frontend_mobile/.env"
    exit 1
}

# --- Écriture du .env mobile ---
$content = @"
EXPO_PUBLIC_BACKEND_API_URL=http://${LocalIP}:3000
EXPO_PUBLIC_BACKEND_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=local
"@

Set-Content -Path $MobileEnv -Value $content -Encoding UTF8

Write-Host "frontend_mobile/.env mis a jour -> http://${LocalIP}:3000"
