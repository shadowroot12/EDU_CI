# 📋 Guide Complet de Déploiement - EDU-CI

**Plateforme Numérique de Gestion Scolaire**  
Version 1.0.0 | Date: 2026-03-04

---

## 📑 Table des Matières

1. [Architecture de Déploiement](#architecture-de-déploiement)
2. [Prérequis Globaux](#prérequis-globaux)
3. [Déploiement du Backend](#déploiement-du-backend)
4. [Déploiement du Frontend](#déploiement-du-frontend)
5. [Configuration des Services Externes](#configuration-des-services-externes)
6. [Variables d'Environnement](#variables-denvironnement)
7. [Configuration DNS & Domaines](#configuration-dns--domaines)
8. [Certificats SSL/TLS](#certificats-ssltls)
9. [Monitoring & Logs](#monitoring--logs)
10. [Checklist de Déploiement](#checklist-de-déploiement)

---

## Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│              http://app.edu-ci.ci ou domaine                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CDN / Frontend Hosting                     │
│    (Vercel, Netlify, CloudFlare Pages, AWS CloudFront)      │
│         Next.js App : Frontend Web (Dashboard)              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (API Requests)
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                      │
│  (Heroku, Railway, Render, AWS EC2, DigitalOcean, Scalingo) │
│           NestJS API + Authentication + Business Logic      │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │  PostgreSQL  │ │    Redis     │ │    MinIO     │
  │   (DB)       │ │  (Cache)     │ │  (Storage)   │
  └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Prérequis Globaux

Avant de commencer, assurez-vous d'avoir :

### ✅ Comptes & Outils Requis
- [ ] **GitHub** - Dépôt du code source
- [ ] **Git** installé localement (`git --version`)
- [ ] **Node.js 18+** (`node --version`)
- [ ] **Docker Desktop** (pour développement local)
- [ ] **Un domaine** (ex: `edu-ci.ci` ou similaire)
- [ ] **SSL/TLS Certificate** (gratuit via Let's Encrypt ou Cloudflare)

### ✅ Sélectionner les Fournisseurs (Choix Recommandés par Budjet)

| Service | Backend | Frontend | DB | Cache | Storage | Budget |
|---------|---------|----------|-----|-------|---------|--------|
| **Budget Minimal** | Railway | Vercel | Railway | Railway | MinIO | ~20-50$/mois |
| **Budget Moyen** | Render | Vercel | Railway | Railway | AWS S3 | ~50-100$/mois |
| **Production Haute** | AWS EC2 | Vercel | AWS RDS | ElastiCache | S3 | ~150-500+$/mois |
| **Très Budget** | PythonAnywhere | Netlify | PlanetScale | Upstash | MinIO | ~15-30$/mois |

**👉 Recommandation pour commencer** : Railway (Backend + DB + Cache) + Vercel (Frontend)

---

## Déploiement du Backend

### Option 1 : Railway ⭐ (Recommandé)

Railway est la solution la plus simple pour déployer le backend.

#### 1.1 Créer un compte Railway
1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Start Project"** → **"Create"**
3. Connectez votre compte GitHub

#### 1.2 Lier votre dépôt GitHub
```bash
# Depuis votre dépôt local
git remote add railway https://github.com/votre-utilisateur/edu-ci.git
git push -u railway main
```

#### 1.3 Créer un nouveau projet Railway
1. Dashboard Railway → **"New Project"** → **"GitHub Repo"**
2. Sélectionnez votre dépôt `edu-ci`
3. Créez un service pour le dossier `backend/`
4. Railway détectera automatically `package.json`

#### 1.4 Configurer les Variables d'Environnement
Dans Railway Dashboard → Votre Project → Environment:

```env
# Backend Configuration
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost  # Sera mis à jour après création PostgreSQL
DB_PORT=5432
DB_USER=edu_user
DB_PASSWORD=<générer-mot-de-passe-fort>
DB_NAME=edu_db

# JWT
JWT_SECRET=<générer-clé-aléatoire-64-caractères>
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost  # Sera mis à jour
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<clé-d'accès>
MINIO_SECRET_KEY=<clé-secrète>
MINIO_BUCKET=edu-files

# CORS
CORS_ORIGIN=https://app.edu-ci.ci

# SMTP (pour notifications email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<application-password>
```

#### 1.5 Déployer
```bash
# Railway détectera les changements depuis GitHub
git push main
# ou depuis Railway CLI
railway deploy
```

✅ Votre backend sera disponible sur : `https://<your-app>.railway.app`

---

### Option 2 : Render.com

#### 2.1 Créer un compte
Allez sur [render.com](https://render.com) → Sign up

#### 2.2 Créer un service Web
1. **Dashboard** → **New** → **Web Service**
2. **GitHub Repository** → Sélectionnez `edu-ci`
3. Configuration:
   - **Name**: `edu-ci-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

#### 2.3 Ajouter les Variables d'Environnement
Dashboard → Service → Environment → Ajouter les variables (voir Option 1)

#### 2.4 Déployer
Render se déclenche automatiquement depuis GitHub

✅ Votre backend sera accessible sur : `https://edu-ci-backend.onrender.com`

---

### Option 3 : Déploiement sur AWS EC2 (Production Avancée)

#### 3.1 Lancer une instance EC2
1. AWS Console → EC2 → **Launch Instance**
2. Image: **Ubuntu 22.04 LTS**
3. Type: **t3.small** (ou supérieur)
4. Security Group: Ouvrir ports **22** (SSH), **3000** (App), **443** (HTTPS)

#### 3.2 Connecter à l'instance
```bash
# Depuis votre machine locale
ssh -i votre-clé.pem ubuntu@votre-ip-ec2

# Installer dépendances
sudo apt update
sudo apt install -y nodejs npm git
sudo apt install -y certbot python3-certbot-nginx
```

#### 3.3 Cloner et préparer le projet
```bash
git clone https://github.com/votre-utilisateur/edu-ci.git
cd edu-ci/backend

# Installer packages
npm install

# Build
npm run build

# Créer un fichier .env à partir des variables nécessaires
nano .env
```

#### 3.4 Utiliser PM2 pour la gestion des processus
```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Lancer l'app avec PM2
pm2 start dist/main.js --name "edu-ci-backend"
pm2 startup
pm2 save

# Vérifier le statut
pm2 list
pm2 logs edu-ci-backend
```

#### 3.5 Configurer Nginx comme Reverse Proxy
```bash
# Installer Nginx
sudo apt install -y nginx

# Créer config
sudo nano /etc/nginx/sites-available/edu-ci-backend
```

Ajoutez:
```nginx
server {
    listen 80;
    server_name api.edu-ci.ci;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis:
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/edu-ci-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3.6 Sécuriser avec SSL via LetsEncrypt
```bash
sudo certbot --nginx -d api.edu-ci.ci
```

---

## Déploiement du Frontend

### Option 1 : Vercel ⭐ (Recommandé)

Vercel est créé par les créateurs de Next.js, la solution optimale.

#### 1.1 Connexion Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. **Sign up** → Connectez votre compte GitHub

#### 1.2 Importer le projet
1. **Add New** → **Project**
2. **Import Git Repository** → Sélectionnez `edu-ci`
3. **Framework Preset**: Next.js (détecté automatiquement)
4. **Root Directory**: `frontend`

#### 1.3 Configurer les Variables d'Environnement
Dashboard → Project Settings → Environment Variables

```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=https://api.edu-ci.ci  # URL du backend
NEXT_PUBLIC_APP_NAME=EDU-CI
NEXT_PUBLIC_APP_VERSION=1.0.0

# Si vous utilisez des variables privées (ne jamais exposer les clés)
# (Aucune clé secrète ne devrait être en frontend)
```

#### 1.4 Déployer
```bash
git push main
# Vercel se déclenche automatiquement depuis GitHub
```

✅ Votre frontend sera accessible sur : `https://edu-ci.vercel.app`  
Vous pouvez aussi configurer un domaine personnalisé (voir section DNS)

---

### Option 2 : Netlify

#### 2.1 Créer un compte Netlify
[netlify.com](https://netlify.com) → Sign up → GitHub

#### 2.2 Importer le site
1. **Add new site** → **Import an existing project**
2. Sélectionnez `edu-ci` depuis GitHub
3. Configuration:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`

#### 2.3 Variables d'Environnement
Deploy → Environment → Edit variables:

```env
NEXT_PUBLIC_API_URL=https://api.edu-ci.ci
NEXT_PUBLIC_APP_NAME=EDU-CI
```

#### 2.4 Déployer
Déclenché automatiquement depuis GitHub

✅ Accessible sur : `https://edu-ci.netlify.app`

---

### Option 3 : AWS Amplify

#### 3.1 Créer une application Amplify
AWS Console → Amplify → **New app** → **Host web app**

#### 3.2 Connexion GitHub
Sélectionnez votre dépôt `edu-ci`

#### 3.3 Configuration Build
- Branch: `main`
- Build settings: Next.js (auto-détecté)
- Frontend Directory: `frontend`

#### 3.4 Ajouter les variables d'environnement
Amplify Console → App Settings → Environment variables

```env
NEXT_PUBLIC_API_URL=https://api.edu-ci.ci
```

---

## Configuration des Services Externes

### PostgreSQL

#### Option A : Railway PostgreSQL (Recommandé)

Railway inclut PostgreSQL gratuit jusqu'à certaines limites.

1. **Railway Dashboard** → Project → **Create** → **PostgreSQL**
2. Les variables de connexion seront auto-injectées dans votre Backend

#### Option B : AWS RDS

```bash
# AWS Console → RDS → Create Database
# Configuration:
# - Engine: PostgreSQL 15
# - Multi-AZ: No (pour dev), Yes (pour prod)
# - Storage: 20GB
# - DB Name: edu_db
# - Master user: edu_user
```

**Connection String** : `postgresql://edu_user:password@seu-rds.amazonaws.com:5432/edu_db`

#### Option C : DigitalOcean Managed Databases

DigitalOcean → Manage → Databases → Create → PostgreSQL

---

### Redis (Cache & Sessions)

#### Option A : Railway Redis

Railway Dashboard → Project → **Create** → **Redis**

#### Option B : Upstash Redis (Gratuit)

1. [upstash.com](https://upstash.com) → Sign up
2. **Create a Database** → Redis
3. Copier le **REDIS_URL** depuis le dashboard

```env
REDIS_URL=redis://default:password@host:port
```

#### Option C : AWS ElastiCache

AWS Console → ElastiCache → **Create Cache Cluster** → Redis

---

### MinIO (Stockage Objet S3-Compatible)

#### Option A : MinIO Auto-Hébergé (Sur votre serveur)

```bash
# Sur votre EC2 ou serveur
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v /data:/data \
  minio/minio server /data --console-address ":9001"

# Console accessible sur : http://votre-ip:9001
```

Créer un bucket:
```bash
# Depuis la console MinIO (9001)
# ou via CLI
mc alias set minio http://localhost:9000 minioadmin minioadmin123
mc mb minio/edu-files
```

#### Option B : AWS S3 (Production Recommandée)

```bash
# AWS Console → S3 → Create Bucket
# Bucket Name: edu-ci-files
# Region: eu-west-1 (ou plus proche)
```

Variables d'environnement pour AWS S3:
```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_BUCKET=edu-ci-files
```

#### Option C : MinIO Cloud Hosted

[MinIO Cloud](https://cloud.minio.io) propose du MinIO hébergé avec SSL inclus.

---

## Variables d'Environnement

### 📄 Backend `.env.production`

```env
# ============ APPLICATION ============
NODE_ENV=production
APP_PORT=3000
APP_NAME=EDU-CI Backend
APP_VERSION=1.0.0

# ============ DATABASE ============
DATABASE_TYPE=postgres
DB_HOST=<DATABASE_HOST>
DB_PORT=5432
DB_USER=edu_user
DB_PASSWORD=<STRONG_PASSWORD_32_CHARS>
DB_NAME=edu_db
DB_SSL=true

# ============ AUTHENTICATION ============
JWT_SECRET=<GENERATE_STRONG_SECRET_64_CHARS>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ============ REDIS ============
REDIS_HOST=<REDIS_HOST>
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>
REDIS_DB=0

# ============ STORAGE (MinIO ou S3) ============
# Pour MinIO:
STORAGE_TYPE=minio
MINIO_ENDPOINT=<MINIO_ENDPOINT>
MINIO_PORT=9000
MINIO_SSL=true
MINIO_ACCESS_KEY=<MINIO_KEY>
MINIO_SECRET_KEY=<MINIO_SECRET>
MINIO_BUCKET=edu-files
MINIO_REGION=us-east-1

# Ou pour AWS S3:
# STORAGE_TYPE=s3
# AWS_REGION=eu-west-1
# AWS_ACCESS_KEY_ID=<S3_ACCESS_KEY>
# AWS_SECRET_ACCESS_KEY=<S3_SECRET>
# AWS_S3_BUCKET=edu-ci-files

# ============ SMTP (Email Notifications) ============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@edu-ci.ci
SMTP_PASS=<APPLICATION_PASSWORD>
SMTP_FROM=EDU-CI <no-reply@edu-ci.ci>

# ============ CORS & SECURITY ============
CORS_ORIGIN=https://app.edu-ci.ci,https://admin.edu-ci.ci
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============ LOGGING ============
LOG_LEVEL=info
LOG_FORMAT=json
```

### 📄 Frontend `.env.production`

```env
# Public API URL (accessible depuis le navigateur)
NEXT_PUBLIC_API_URL=https://api.edu-ci.ci

# Application Info
NEXT_PUBLIC_APP_NAME=EDU-CI
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=<GOOGLE_ANALYTICS_ID>
# NEXT_PUBLIC_SENTRY_DSN=<SENTRY_PROJECT_URL>
```

### 🔒 Comment Générer des Secrets Forts

```bash
# Générer une clé secrète JWT (64 caractères)
openssl rand -base64 48

# Générer un mot de passe fort PostgreSQL
openssl rand -base64 32

# Depuis Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Configuration DNS & Domaines

### Scénario : Vous avez un domaine `edu-ci.ci`

#### 1️⃣ Configuration des Subdomaines

Vous allez créer 3 sous-domaines:
- `api.edu-ci.ci` → Backend (Railway, Render, EC2, etc)
- `app.edu-ci.ci` → Frontend (Vercel, Netlify)
- `storage.edu-ci.ci` → MinIO (optionnel, pour l'admin)

#### 2️⃣ Ajouter les Enregistrements DNS

Connectez-vous à votre registrar (OVH, Godaddy, Namecheap, etc) et allez à la section **DNS**

**Cas A : Backend sur Railway/Render**

```dns
api  CNAME  <app-railway-url>.railway.app     (or .onrender.com)
```

**Cas B : Frontend sur Vercel**

```dns
app  CNAME  cname.vercel.com
```

Puis configurez dans Vercel Dashboard → Domaines → Ajouter `app.edu-ci.ci`

**Cas C : MinIO (optionnel)**

```dns
storage  CNAME  <votre-serveur-ip>  (ou domaine MinIO)
```

#### 3️⃣ Configuration Complète Pour Examples

**Exemple avec OVH :**

1. Connectez-vous à OVH → Domaines → `edu-ci.ci`
2. **Onglet DNS** → Ajouter un enregistrement:

| Sous-domaine | Type | Cible |
|---|---|---|
| api | CNAME | `edu-ci-backend.railway.app` |
| app | CNAME | `cname.vercel.com` |
| www | CNAME | `cname.vercel.com` |
| @ | A | `<IP du serveur principal>` |

3. Attendre la propagation DNS (15 minutes à 48h)

```bash
# Vérifier la propagation
nslookup api.edu-ci.ci
nslookup app.edu-ci.ci

# Ou avec dig
dig api.edu-ci.ci
```

---

## Certificats SSL/TLS

### Option 1 : Vercel & Certbot (Gratuit) ⭐

#### Pour le Frontend (Vercel):
- Vercel fournit automatiquement un **SSL gratuit** pour `app.edu-ci.ci`
- Aucune action requise

#### Pour le Backend:

**Si vous êtes sur Render/Railway** :
- Render et Railway incluent SSL **gratuit** automatiquement ✅

**Si vous êtes sur AWS EC2/DigitalOcean** :

```bash
# Installer certbot
sudo apt-get install certbot python3-certbot-nginx

# Générer et installer le certificat
sudo certbot certonly --nginx -d api.edu-ci.ci

# Auto-renouvellement (85 jours avant expiration)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Vérifier le renouvellement
sudo certbot renew --dry-run
```

### Option 2 : CloudFlare (Gratuit avec Plus de Fonctionnalités)

1. Changez les nameservers de votre domaine vers CloudFlare
2. CloudFlare → Domaines → SSL/TLS → Mode Full
3. CloudFlare fournit un SSL gratuit pour tous les subdomaines

---

## Monitoring & Logs

### Backend - Monitoring

#### Option 1 : Intégration Native des Fournisseurs

**Railway** → Logs & Monitoring inclus
```bash
# Via CLI
railway logs
```

**Render** → Logs Dashboard
```bash
# Logs automatically available
```

#### Option 2 : Sentry (Error Tracking)

```bash
# Installer Sentry
npm install @sentry/node @sentry/tracing --save

# Dans votre main.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### Option 3 : OpenTelemetry + Grafana

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node
```

### Frontend - Monitoring

#### Option 1 : Vercel Analytics
Vercel → Project Settings → Analytics (gratuit)

#### Option 2 : Sentry Frontend
```bash
npm install @sentry/nextjs

# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### Option 3 : Google Analytics / Segment

```bash
npm install @segment/analytics-next
```

---

## Processus de Déploiement Pas à Pas

### 🔄 Phase 1 : Préparation (jour 0-1)

- [ ] Acheter/Configurer le domaine `edu-ci.ci`
- [ ] Créer comptes Railway, Vercel (ou alternatives choisies)
- [ ] Créer dépôt GitHub privé avec la structure du projet
- [ ] Générer JWT_SECRET, DB_PASSWORD, REDIS_PASSWORD
- [ ] Créer fichier `.env.production`

### 🚀 Phase 2 : Déploiement Backend (jour 1-2)

- [ ] Pousser le code sur GitHub
- [ ] **Railway** : Créer service Backend
- [ ] **Railway** : Créer service PostgreSQL
- [ ] **Railway** : Créer service Redis
- [ ] Configurer variables d'environnement dans Railway
- [ ] Vérifier les logs du déploiement `railway logs`
- [ ] Tester l'API avec Postman/Insomnia : `GET https://api.edu-ci.ci/health`

### 🎨 Phase 3 : Déploiement Frontend (jour 2-3)

- [ ] **Vercel** : Importer le projet
- [ ] Configurer **Root Directory** : `frontend`
- [ ] Ajouter `NEXT_PUBLIC_API_URL` en variables d'environnement
- [ ] Déclencher déploiement
- [ ] Vérifier la compilation `npm run build` localement
- [ ] Tester l'accès à `app.edu-ci.ci`

### 🔗 Phase 4 : Configuration DNS (jour 3-4)

- [ ] Ajouter enregistrements CNAME pour `api.edu-ci.ci` → Railway
- [ ] Ajouter enregistrements CNAME pour `app.edu-ci.ci` → Vercel
- [ ] Attendre propagation DNS (~4h)
- [ ] Tester avec `nslookup` / `dig`

```bash
nslookup api.edu-ci.ci
nslookup app.edu-ci.ci
```

### 🔐 Phase 5 : SSL & Sécurité (jour 4-5)

- [ ] Vercel installe automatiquement le certificat pour `app.edu-ci.ci`
- [ ] Railway installe automatiquement le certificat pour `api.edu-ci.ci`
- [ ] Tester HTTPS : `curl -I https://api.edu-ci.ci`
- [ ] Vérifier dans le navigateur que le certificat est valide

### ✅ Phase 6 : Tests & Validation (jour 5-7)

- [ ] Effectuer des tests manuels des workflows clés :
  - Authentification (Login)
  - Création d'étudiant
  - Publication de notes
  - Génération de bulletins
- [ ] Tester sur mobile (responsive design)
- [ ] Vérifier les performances avec Lighthouse (Vercel)
- [ ] Tester depuis différents réseaux (WiFi, mobile data, VPN)

### 📊 Phase 7 : Monitoring & Optimisation (jour 7+)

- [ ] Configurer alertes error rate
- [ ] Mettre en place backups automatiques PostgreSQL
- [ ] Configurer monitoring Redis (RAM, CPU)
- [ ] Mettre en place logs centralisés
- [ ] Documenter procédures de maintenance

---

## Checklist Pré-Déploiement

### 🔍 Backend

- [ ] `npm run build` compile sans erreurs
- [ ] `npm run lint` retourne 0 erreurs
- [ ] Variables `.env.production` complètement remplies
- [ ] Database migrations prêtes
- [ ] Seed data corrigé (si nécessaire)
- [ ] API documentation (Swagger) à jour
- [ ] CORS configuré pour le domaine frontend
- [ ] JWT secrets strong (min 32 caractères)
- [ ] Logs en format JSON (structured logging)

### 🎨 Frontend

- [ ] `npm run build` compile sans erreurs
- [ ] `npm run lint` retourne 0 erreurs
- [ ] Variables `.env.production` correctement définies
- [ ] Images optimisées (Next.js Image component)
- [ ] Code splitting vérifié (vercel analytics)
- [ ] Aucun console.log en production
- [ ] Responsive design testé sur mobile
- [ ] Lighthouse score > 80

### 🔐 Sécurité Générale

- [ ] Secrets **JAMAIS** en GitHub (utiliser secrets manager)
- [ ] HTTPS force pour tous les endpoints
- [ ] CORS restrictif (domaines whitelistés)
- [ ] Rate limiting implémenté
- [ ] SQL Injection protection (TypeORM paramétrisé)
- [ ] XSS protection (Next.js par défaut)
- [ ] CSRF tokens si applicable
- [ ] Password hashing (bcrypt with salt)
- [ ] Pas de données sensibles en logs
- [ ] Dépendances npm à jour (`npm audit`)

### 📊 Performance

- [ ] Backend response time < 200ms (95e percentile)
- [ ] Frontend First Contentful Paint < 2s
- [ ] API rate limits configurés
- [ ] Database indexes optimisés
- [ ] Caching strategy définie (Redis, CDN)
- [ ] Compression Gzip activée

### 🗄️ Infrastructure

- [ ] Backups PostgreSQL automatiques (daily)
- [ ] Alertes monitoring configurées
- [ ] Logs retention policy défini
- [ ] Disaster recovery plan documenté
- [ ] Load testing effectué (si applicable)

---

## Dépannage Courant

### ❌ Erreur : "Cannot GET /"

**Backend**: Vérifier que le port 3000 est exposé en production

```env
PORT=3000  # ou variable d'environnement
```

### ❌ Erreur : CORS Blocked

Vérifier que `CORS_ORIGIN` inclut le domaine frontend:

```env
CORS_ORIGIN=https://app.edu-ci.ci,https://*.vercel.app
```

Backend (NestJS):
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true,
});
```

### ❌ Erreur : "Cannot connect to database"

- [ ] Vérifier `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- [ ] Vérifier que la DB est accessible (firewall, security groups)
- [ ] Tester la connexion: `psql postgresql://user:pass@host:5432/dbname`

### ❌ Erreur : "Redis connection refused"

- [ ] Vérifier `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- [ ] Tester: `redis-cli -h <host> -p <port> PING`

### ❌ Frontend cannot reach Backend API

- [ ] Vérifier `NEXT_PUBLIC_API_URL` est à jour
- [ ] Vérifier les logs Network dans DevTools
- [ ] S'assurer que l'API CORS accepte le domaine du frontend
- [ ] Tester l'endpoint directement: `curl https://api.edu-ci.ci/health`

---

## Support & Maintenance Continued

### 📅 Maintenance Régulière

**Hebdomadaire** :
- Vérifier les logs pour erreurs récurrentes
- Vérifier l'uptime (99%+ visé)
- Revoir les slowest API endpoints

**Mensuellement** :
- Mettre à jour les dépendances npm (`npm outdated`)
- Revoir les métriques de performance
- Tester les backups (effectuer une restauration de test)
- Analyser les logs d'erreur
- Vérifier les certificats SSL (> 30 jours avant expiration)

**Trimestriellement** :
- Audit de sécurité (`npm audit`, dépendances vulnérables)
- Load testing pour préparer la croissance
- Réévaluation des coûts d'infrastructure
- Planifier les upgrades si nécessaire

### 🚨 Procédure en Cas d'Incident

1. **Alertes reçues** →Vérifier l'uptime/logs
2. **Isoler le problème** → Backend? Frontend? Infrastructure?
3. **Notifications** → Informer les administrateurs
4. **Rollback rapide** → Revenir à la dernière version stable
5. **Analyse post-incident** → Documenter la cause et prévention

---

## Ressources Utiles

### Documentation Officielle
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)

### Outils de Déploiement
- [Railway.app](https://railway.app)
- [Render.com](https://render.com)
- [Vercel](https://vercel.com)
- [AWS Console](https://console.aws.amazon.com/)

### Sécurité & Monitoring
- [Sentry](https://sentry.io) - Error Tracking
- [DataDog](https://datadoghq.com) - Monitoring
- [Cloudflare](https://cloudflare.com) - DDoS Protection
- [OWASP](https://owasp.org) - Security Best Practices

---

## Conclusion

Ce guide couvre les étapes principales de déploiement de l'application EDU-CI. Adaptez les configurations selon vos besoins spécifiques et les fournisseurs choisis.

**Pour continuer** :
1. Sélectionnez les fournisseurs appropriés (cf. tableau de recommandations)
2. Suivez exactement les phases de déploiement
3. Utilisez la checklist pour valider chaque étape
4. Documentez tout changement pour la maintenance future

**Questions supplémentaires** : Consultez la documentation officielle des fournisseurs ou contactez le support technique.

---

**Dernière mise à jour** : 2026-03-04  
**Version** : 1.0.0
