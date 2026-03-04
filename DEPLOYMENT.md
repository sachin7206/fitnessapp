# 🚀 Deployment Guide - Fitness App

## Architecture Overview

```
Mobile App (Play Store)
    ↓ HTTPS
API Gateway (Render)
    ↓ Direct HTTP
┌─────────┬──────────────┬───────────────┬──────────────┬───────────────┬────────────┐
│  User   │  Nutrition   │   Exercise    │   Progress   │   Wellness    │     AI     │
│ Service │   Service    │   Service     │   Service    │   Service     │  Service   │
│(Render) │  (Render)    │   (Render)    │  (Render)    │   (Render)    │ (Render)   │
└────┬────┴──────┬───────┴───────┬───────┴──────┬───────┴───────┬───────┴─────┬──────┘
     │           │               │              │               │             │
     └───────────┴───────────────┴──────────────┴───────────────┘             │
                              MySQL (TiDB Cloud)                        Gemini API
```

## Free Services Used

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Backend (7 services) | [Render](https://render.com) | Free Web Services (sleeps after 15min) |
| Database | [TiDB Cloud Serverless](https://tidbcloud.com) | 5 GiB storage, 50M RU/month |
| AI | [Google AI Studio](https://aistudio.google.com) | Free Gemini API |
| CI/CD | [GitHub Actions](https://github.com/features/actions) | 2,000 min/month |
| Container Registry | [GitHub Packages](https://ghcr.io) | Free for public repos |
| Mobile Builds | [EAS Build](https://expo.dev) | 30 builds/month free |
| App Store | [Google Play Console](https://play.google.com/console) | $25 one-time fee |

## Step-by-Step Deployment

### 1️⃣ Set Up Free MySQL Database (TiDB Cloud)

1. Go to [tidbcloud.com](https://tidbcloud.com) and create a free account
2. Create a **Serverless** cluster (free tier)
3. Create 5 databases in the cluster:
   ```sql
   CREATE DATABASE fitnessapp_users;
   CREATE DATABASE fitnessapp_nutrition;
   CREATE DATABASE fitnessapp_exercises;
   CREATE DATABASE fitnessapp_progress;
   CREATE DATABASE fitnessapp_wellness;
   ```
4. Note your connection details:
   - Host: `gateway01.xx.prod.aws.tidbcloud.com`
   - Port: `4000`
   - Username: your TiDB username
   - Password: your TiDB password
5. Format your DATABASE_URL:
   ```
   jdbc:mysql://gateway01.xx.prod.aws.tidbcloud.com:4000/fitnessapp_users?useSSL=true&requireSSL=true&serverTimezone=UTC
   ```

### 2️⃣ Deploy Backend to Render

**Option A: One-Click Blueprint Deploy (Recommended)**

1. Go to [render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click "New Blueprint Instance"
3. Connect your GitHub repo: `sachin7206/fitnessapp`
4. Render will read `render.yaml` and create all 7 services
5. Fill in the secret env vars for each service:
   - `DATABASE_URL` → Your TiDB connection URL (with correct database name)
   - `DB_USERNAME` → Your TiDB username
   - `DB_PASSWORD` → Your TiDB password
   - `JWT_SECRET` → A strong random string (use `openssl rand -hex 32`)
   - `GEMINI_API_KEYS` → Your Gemini API keys (comma-separated)
   - `MAIL_USERNAME` → Gmail address (user-service only)
   - `MAIL_PASSWORD` → Gmail app password (user-service only)

**Option B: Manual Deploy (One Service at a Time)**

For each service:
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `fitnessapp-user` (or nutrition, exercise, etc.)
   - **Root Directory**: leave empty (Dockerfile uses repo root)
   - **Runtime**: Docker
   - **Dockerfile Path**: `user-service/Dockerfile`
   - **Plan**: Free
4. Add environment variables (see above)
5. Click "Create Web Service"

Deploy order: AI Service → User Service → Others → API Gateway

### 3️⃣ Verify Backend Deployment

After all services are deployed, test:
```bash
# Check API Gateway health
curl https://fitnessapp-gateway.onrender.com/api/health

# Test login
curl -X POST https://fitnessapp-gateway.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'
```

> **Note**: First request may take 30-60 seconds (cold start on free tier).

### 4️⃣ Build & Deploy Mobile App

#### Prerequisites
- Node.js 18+
- Expo account ([expo.dev](https://expo.dev))
- Google Play Developer account ($25 one-time)

#### Steps

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to mobile directory
cd mobile

# Configure your project
eas build:configure

# Update app.json with your EAS project ID
# (EAS will provide this during configuration)
```

#### Update API URL for Production

Edit `mobile/app.json`:
```json
"extra": {
  "apiUrl": "https://fitnessapp-gateway.onrender.com/api"
}
```

#### Build APK for Testing

```bash
# Build APK (for internal testing - shareable file)
eas build --platform android --profile preview

# Download the APK from the Expo dashboard and share with testers
```

#### Build AAB for Play Store

```bash
# Build AAB (required for Play Store)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

#### Google Play Console Setup

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create a new app → "Fitness Wellness"
3. Fill in store listing (title, description, screenshots)
4. Go to **Testing** → **Internal testing** → Create a new release
5. Upload the AAB file from EAS Build
6. Add testers by email
7. Roll out to internal testing

### 5️⃣ Set Up CI/CD (Automatic)

The GitHub Actions workflows are already configured:

- `.github/workflows/deploy-services.yml` - Builds Docker images on push to main
- `.github/workflows/build-mobile.yml` - Builds mobile app when mobile/ changes

**Required GitHub Secrets:**
```
EXPO_TOKEN          → Your Expo access token (expo.dev → Account → Access Tokens)
RENDER_DEPLOY_HOOK_* → Render deploy hook URLs (from each service's Settings → Deploy Hook)
```

## Environment Variables Reference

### All Backend Services
| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `prod` |
| `JWT_SECRET` | JWT signing key | `your-256-bit-secret` |
| `DATABASE_URL` | Full JDBC URL | `jdbc:mysql://host:4000/dbname?useSSL=true` |
| `DB_USERNAME` | Database username | `your-tidb-user` |
| `DB_PASSWORD` | Database password | `your-tidb-pass` |

### API Gateway Only
| Variable | Description |
|----------|-------------|
| `USER_SERVICE_URL` | `https://fitnessapp-user.onrender.com` |
| `NUTRITION_SERVICE_URL` | `https://fitnessapp-nutrition.onrender.com` |
| `EXERCISE_SERVICE_URL` | `https://fitnessapp-exercise.onrender.com` |
| `PROGRESS_SERVICE_URL` | `https://fitnessapp-progress.onrender.com` |
| `WELLNESS_SERVICE_URL` | `https://fitnessapp-wellness.onrender.com` |
| `AI_SERVICE_URL` | `https://fitnessapp-ai.onrender.com` |

### AI Service Only
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEYS` | Comma-separated Gemini API keys |
| `GEMINI_MODEL` | Model name (default: `gemma-3-27b-it`) |

### User Service Only
| Variable | Description |
|----------|-------------|
| `MAIL_USERNAME` | Gmail address for password reset |
| `MAIL_PASSWORD` | Gmail app password |

## Cost Summary

| Item | Cost |
|------|------|
| Render (7 services) | **FREE** |
| TiDB Cloud Serverless | **FREE** (5 GiB) |
| Google AI Studio | **FREE** |
| GitHub Actions CI/CD | **FREE** (2,000 min/month) |
| EAS Build | **FREE** (30 builds/month) |
| Google Play Console | **$25** one-time |
| **Total** | **$25 one-time** |

## Troubleshooting

### Services sleeping (Render free tier)
Free tier services sleep after 15 minutes of inactivity. First request takes 30-60 seconds to wake up. This is normal for testing.

### Database connection issues
Make sure your TiDB connection URL includes `?useSSL=true&requireSSL=true`.

### Liquibase migrations fail
Ensure the database user has CREATE/ALTER/DROP privileges.

### Cold start timeout
The API Gateway may time out waiting for backend services to wake up. Retry the request.

