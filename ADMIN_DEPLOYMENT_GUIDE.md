# 🚀 Guide de Déploiement Frontend Admin - Remindy

Guide complet pour déployer votre application React + Vite (frontend admin) en production.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Vercel (Recommandé)](#vercel-recommandé)
3. [Netlify](#netlify)
4. [AWS S3 + CloudFront](#aws-s3--cloudfront)
5. [Nginx (Self-hosted)](#nginx-self-hosted)
6. [Docker](#docker)
7. [Variables d'Environnement](#variables-denvironnement)
8. [CI/CD](#cicd)
9. [Optimisations](#optimisations)

---

## 1. Vue d'ensemble

### Stack Technique

- **Framework** : React 19
- **Build Tool** : Vite 7
- **Language** : TypeScript
- **Type** : Single Page Application (SPA)

### Prérequis Build

```bash
cd frontend_admin

# Installer les dépendances
npm install

# Build de production
npm run build

# Résultat dans dist/
# → dist/index.html
# → dist/assets/*.js
# → dist/assets/*.css
```

### Taille du Build

- **Production** : ~150-300 KB (minifié + gzippé)
- **Temps de build** : 5-15 secondes

---

## 2. Vercel (Recommandé) ⭐

### Pourquoi Vercel ?

- ✅ **Gratuit** pour projets personnels
- ✅ **Déploiement automatique** depuis GitHub
- ✅ **CDN global** inclus
- ✅ **SSL automatique**
- ✅ **Preview deployments** pour PR
- ✅ **Analytics** intégrés
- ✅ **Optimisé pour Vite/React**

### Installation

```bash
# Installer Vercel CLI
npm install -g vercel
```

### Déploiement Manuel (Quick Start)

```bash
cd frontend_admin

# Login
vercel login

# Déployer (première fois)
vercel

# Questions:
# - Setup and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No
# - Project name? → remindy-admin
# - Directory? → ./
# - Override build settings? → No

# Déployer en production
vercel --prod
```

**Résultat** :
- Preview : `https://remindy-admin-xxx.vercel.app`
- Production : `https://remindy-admin.vercel.app`

### Configuration vercel.json

Créez `frontend_admin/vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_ENV": "@vite_env"
  }
}
```

### Déploiement Automatique GitHub

1. **Push sur GitHub**
   ```bash
   git add .
   git commit -m "Setup Vercel deployment"
   git push origin main
   ```

2. **Connecter Vercel**
   - Allez sur https://vercel.com
   - **New Project**
   - **Import Git Repository**
   - Sélectionnez `remindy_personal`
   - **Root Directory** : `frontend_admin`
   - **Framework Preset** : Vite
   - **Deploy**

3. **Configuration automatique**
   - Vercel détecte Vite automatiquement
   - Build Command : `npm run build`
   - Output Directory : `dist`

### Variables d'Environnement sur Vercel

1. **Dashboard Vercel** → **Settings** → **Environment Variables**

```
VITE_API_URL = https://api.remindy.app
VITE_ENV = production
```

2. **Redéployer** pour appliquer les variables

### Custom Domain

1. **Dashboard Vercel** → **Settings** → **Domains**
2. Ajouter : `admin.remindy.app`
3. Configurer DNS :
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```

### Coûts Vercel

| Plan | Prix | Features |
|------|------|----------|
| **Hobby** | Gratuit | 100 GB bandwidth, illimité deployments |
| **Pro** | $20/mois | Analytics, plus de bandwidth |

---

## 3. Netlify

### Installation

```bash
# Installer Netlify CLI
npm install -g netlify-cli
```

### Déploiement Manuel

```bash
cd frontend_admin

# Login
netlify login

# Build
npm run build

# Déployer
netlify deploy

# Production
netlify deploy --prod
```

### Configuration netlify.toml

Créez `frontend_admin/netlify.toml` :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"

[[headers]]
  for = "/*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"
```

### Déploiement Automatique GitHub

1. **Netlify Dashboard** → **New site from Git**
2. **Connect to GitHub**
3. **Configure** :
   - Base directory : `frontend_admin`
   - Build command : `npm run build`
   - Publish directory : `frontend_admin/dist`
4. **Deploy site**

### Custom Domain sur Netlify

1. **Site Settings** → **Domain management**
2. **Add custom domain** : `admin.remindy.app`
3. **Configure DNS** :
   ```
   Type: CNAME
   Name: admin
   Value: [your-site].netlify.app
   ```

### Coûts Netlify

| Plan | Prix | Features |
|------|------|----------|
| **Starter** | Gratuit | 100 GB bandwidth |
| **Pro** | $19/mois | Plus de bandwidth, analytics |

---

## 4. AWS S3 + CloudFront

### Avantages

- ✅ **Très scalable**
- ✅ **Contrôle total**
- ✅ **Intégration AWS**
- ⚠️ Plus complexe à configurer

### Étape 1 : Créer Bucket S3

```bash
# Via AWS CLI
aws s3 mb s3://remindy-admin

# Activer static website hosting
aws s3 website s3://remindy-admin \
  --index-document index.html \
  --error-document index.html
```

### Étape 2 : Policy du Bucket

Créez `bucket-policy.json` :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::remindy-admin/*"
    }
  ]
}
```

Appliquez :
```bash
aws s3api put-bucket-policy \
  --bucket remindy-admin \
  --policy file://bucket-policy.json
```

### Étape 3 : Upload des Fichiers

```bash
cd frontend_admin

# Build
npm run build

# Upload vers S3
aws s3 sync dist/ s3://remindy-admin \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# index.html sans cache
aws s3 cp dist/index.html s3://remindy-admin/index.html \
  --cache-control "no-cache"
```

### Étape 4 : CloudFront Distribution

1. **CloudFront Console** → **Create Distribution**
2. **Origin** :
   - Origin domain : `remindy-admin.s3-website-eu-west-1.amazonaws.com`
   - Protocol : HTTP only
3. **Default Cache Behavior** :
   - Viewer Protocol Policy : Redirect HTTP to HTTPS
   - Allowed HTTP Methods : GET, HEAD
   - Cache Policy : CachingOptimized
4. **Distribution Settings** :
   - Price Class : Use All Edge Locations
   - Alternate Domain Names : `admin.remindy.app`
   - SSL Certificate : Request certificate (ACM)
   - Default Root Object : `index.html`

### Étape 5 : Configuration Route 53

1. **Route 53** → **Hosted Zone** → `remindy.app`
2. **Create Record** :
   - Name : `admin`
   - Type : A (Alias)
   - Alias Target : CloudFront distribution

### Script de Déploiement

Créez `frontend_admin/deploy-aws.sh` :

```bash
#!/bin/bash

# Build
echo "Building..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://remindy-admin \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://remindy-admin/index.html \
  --cache-control "no-cache"

# Invalidate CloudFront
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

### Coûts AWS

| Service | Prix estimé |
|---------|-------------|
| **S3 Storage** | ~$0.50/mois (20 GB) |
| **S3 Requests** | ~$0.10/mois (100k req) |
| **CloudFront** | ~$1-5/mois (1 GB transfer) |
| **Route 53** | $0.50/mois (hosted zone) |
| **TOTAL** | **~$2-6/mois** |

---

## 5. Nginx (Self-hosted)

### Installation Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Configuration Nginx

Créez `/etc/nginx/sites-available/remindy-admin` :

```nginx
server {
    listen 80;
    server_name admin.remindy.app;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.remindy.app;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/admin.remindy.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.remindy.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/remindy-admin/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # SPA routing - redirect all to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Activer le Site

```bash
# Créer symlink
sudo ln -s /etc/nginx/sites-available/remindy-admin /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d admin.remindy.app

# Auto-renewal (ajouté automatiquement)
sudo certbot renew --dry-run
```

### Script de Déploiement

Créez `frontend_admin/deploy-nginx.sh` :

```bash
#!/bin/bash

SERVER="user@your-server.com"
REMOTE_DIR="/var/www/remindy-admin"

# Build
echo "Building..."
npm run build

# Upload to server
echo "Uploading to server..."
rsync -avz --delete dist/ $SERVER:$REMOTE_DIR/

# Restart Nginx (if needed)
ssh $SERVER "sudo systemctl reload nginx"

echo "Deployment complete!"
```

---

## 6. Docker

### Dockerfile

Créez `frontend_admin/Dockerfile` :

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf pour Docker

Créez `frontend_admin/nginx.conf` :

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}
```

### docker-compose.yml

Créez `frontend_admin/docker-compose.yml` :

```yaml
version: '3.8'

services:
  admin:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:80"
    environment:
      - VITE_API_URL=${VITE_API_URL}
      - VITE_ENV=production
    restart: unless-stopped
    networks:
      - remindy-network

networks:
  remindy-network:
    external: true
```

### Build et Run

```bash
cd frontend_admin

# Build l'image
docker build -t remindy-admin:latest .

# Run le container
docker run -d \
  --name remindy-admin \
  -p 3001:80 \
  -e VITE_API_URL=https://api.remindy.app \
  remindy-admin:latest

# Avec docker-compose
docker-compose up -d
```

### Push vers Registry

```bash
# Docker Hub
docker tag remindy-admin:latest your-username/remindy-admin:latest
docker push your-username/remindy-admin:latest

# AWS ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.eu-west-1.amazonaws.com

docker tag remindy-admin:latest 123456789.dkr.ecr.eu-west-1.amazonaws.com/remindy-admin:latest
docker push 123456789.dkr.ecr.eu-west-1.amazonaws.com/remindy-admin:latest
```

---

## 7. Variables d'Environnement

### .env Files

Vite utilise des fichiers `.env` avec le préfixe `VITE_` :

```bash
# .env.production
VITE_API_URL=https://api.remindy.app
VITE_ENV=production
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Utilisation dans le Code

```typescript
// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  environment: import.meta.env.VITE_ENV || 'development',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
};
```

### Build avec Env Vars

```bash
# Charger .env.production
npm run build

# Ou override
VITE_API_URL=https://staging-api.remindy.app npm run build
```

---

## 8. CI/CD

### GitHub Actions - Vercel

Créez `.github/workflows/deploy-admin-vercel.yml` :

```yaml
name: Deploy Admin to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'frontend_admin/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend_admin/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend_admin/package-lock.json

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel Environment
        run: |
          cd frontend_admin
          vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: |
          cd frontend_admin
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: |
          cd frontend_admin
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### GitHub Actions - AWS S3

Créez `.github/workflows/deploy-admin-aws.yml` :

```yaml
name: Deploy Admin to AWS

on:
  push:
    branches: [main]
    paths:
      - 'frontend_admin/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend_admin/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend_admin
          npm ci

      - name: Build
        run: |
          cd frontend_admin
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_ENV: production

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1

      - name: Deploy to S3
        run: |
          cd frontend_admin
          aws s3 sync dist/ s3://remindy-admin \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "index.html"

          aws s3 cp dist/index.html s3://remindy-admin/index.html \
            --cache-control "no-cache"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## 9. Optimisations

### vite.config.ts Optimisé

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Optimisations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },

    // Source maps en production (optionnel)
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // Optimisations de preview
  preview: {
    port: 3001,
    strictPort: true,
  },
});
```

### Compression Brotli

```bash
# Installer plugin
npm install -D vite-plugin-compression

# vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
});
```

### Analyse du Bundle

```bash
# Installer
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});

# Build et voir l'analyse
npm run build
```

---

## 📊 Comparaison des Solutions

| Solution | Complexité | Coût | Performance | Recommandé pour |
|----------|------------|------|-------------|-----------------|
| **Vercel** | ⭐ Facile | Gratuit - $20 | ⭐⭐⭐⭐⭐ | Projets perso/startup |
| **Netlify** | ⭐ Facile | Gratuit - $19 | ⭐⭐⭐⭐⭐ | Alternative à Vercel |
| **AWS S3+CF** | ⭐⭐⭐ Moyen | ~$2-6/mois | ⭐⭐⭐⭐⭐ | Entreprise, scalabilité |
| **Nginx** | ⭐⭐⭐⭐ Difficile | $5-10/mois | ⭐⭐⭐⭐ | Contrôle total |
| **Docker** | ⭐⭐⭐ Moyen | Variable | ⭐⭐⭐⭐ | Multi-env, microservices |

---

## ✅ Checklist de Déploiement

### Avant le Build

- [ ] Tests passent (`npm test`)
- [ ] Lint passe (`npm run lint`)
- [ ] Build réussit localement (`npm run build`)
- [ ] Preview fonctionne (`npm run preview`)
- [ ] Variables d'environnement configurées

### Configuration Production

- [ ] `.env.production` créé
- [ ] API URL correcte
- [ ] Analytics configuré (Google Analytics, etc.)
- [ ] Sentry/monitoring configuré
- [ ] Favicon et meta tags optimisés

### Après le Déploiement

- [ ] Site accessible via HTTPS
- [ ] Routing SPA fonctionne (refresh page)
- [ ] Console browser sans erreurs
- [ ] Performance vérifiée (Lighthouse)
- [ ] SSL valide (pas d'erreurs certificat)
- [ ] DNS correctement configuré
- [ ] Cache fonctionne (vérifier headers)

---

## 🎯 Recommandation

Pour **Remindy Admin** :

1. **Démarrer avec Vercel** (gratuit, simple, rapide)
2. **Si > 100k visiteurs/mois** → AWS S3 + CloudFront
3. **Si contrôle total requis** → Nginx self-hosted

**Workflow idéal** :
- **Development** : `npm run dev`
- **Staging** : Vercel preview deployments (auto sur PR)
- **Production** : Vercel production (auto sur merge main)

---

## 📚 Ressources

- **Vite Docs** : https://vitejs.dev/guide/
- **Vercel Docs** : https://vercel.com/docs
- **Netlify Docs** : https://docs.netlify.com
- **AWS S3** : https://aws.amazon.com/s3/
- **CloudFront** : https://aws.amazon.com/cloudfront/

---

## 🎉 Prochaines Étapes

1. **Lire ce guide**
2. **Choisir une solution** (Vercel recommandé)
3. **Configurer les variables d'environnement**
4. **Premier déploiement**
5. **Setup CI/CD**
6. **Configurer custom domain**

Voir `ADMIN_DEPLOYMENT_QUICKSTART.md` pour déployer en 10 minutes !
