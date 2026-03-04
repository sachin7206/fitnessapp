# 🌐 Free Web Deployment Guide

Deploy the Fitness Wellness app on the web for free — no Play Store needed!

## Quick Summary

| Component | Free Service | Setup Time |
|-----------|-------------|------------|
| **Frontend (Web App)** | Vercel / Netlify / GitHub Pages | 5 min |
| **Backend (7 APIs)** | Render.com | 15 min |
| **Database** | TiDB Cloud Serverless | 5 min |
| **Total Cost** | **$0** | ~25 min |

---

## 🖥️ Option 1: Deploy Frontend to Vercel (Recommended — Fastest)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your repo: `sachin7206/fitnessapp`
4. Configure:
   - **Root Directory**: `mobile`
   - **Framework Preset**: Other
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Name**: `EXPO_PUBLIC_API_URL`
   - **Value**: `https://fitnessapp-gateway.onrender.com/api` (update after backend deploy)
6. Click **Deploy**

Your app will be live at: `https://fitnessapp-xxxx.vercel.app`

---

## 🖥️ Option 2: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) → Sign up with GitHub
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub → Select `sachin7206/fitnessapp`
4. Configure:
   - **Base directory**: `mobile`
   - **Build command**: `npx expo export --platform web`
   - **Publish directory**: `mobile/dist`
5. Add Environment Variable:
   - **Key**: `EXPO_PUBLIC_API_URL`
   - **Value**: `https://fitnessapp-gateway.onrender.com/api`
6. Click **Deploy site**

Your app will be live at: `https://fitnessapp-xxxx.netlify.app`

---

## 🖥️ Option 3: Deploy Frontend to GitHub Pages (No Third Party Needed)

1. Go to your repo: `github.com/sachin7206/fitnessapp`
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select: **GitHub Actions**
4. Go to **Settings** → **Variables** → **Actions** → **Variables** tab
5. Add a repository variable:
   - **Name**: `API_URL`
   - **Value**: `https://fitnessapp-gateway.onrender.com/api`
6. Go to **Actions** tab → **Deploy Web App** → Click **"Run workflow"**

Your app will be live at: `https://sachin7206.github.io/fitnessapp`

---

## ⚙️ Deploy Backend to Render (Free)

### Step 1: Create Free Database (TiDB Cloud)

1. Go to [tidbcloud.com](https://tidbcloud.com) → Create free account
2. Create a **Serverless** cluster
3. In SQL Editor, run:
   ```sql
   CREATE DATABASE fitnessapp_users;
   CREATE DATABASE fitnessapp_nutrition;
   CREATE DATABASE fitnessapp_exercises;
   CREATE DATABASE fitnessapp_progress;
   CREATE DATABASE fitnessapp_wellness;
   ```
4. Go to **Connect** → copy the host, port, username, password

### Step 2: Deploy Services to Render

**One-Click Blueprint Deploy:**

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **"New Blueprint Instance"**
3. Connect GitHub → Select `sachin7206/fitnessapp`
4. Render reads `render.yaml` and creates all 7 services automatically
5. Fill in the secrets:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Run `openssl rand -hex 32` to generate |
| `DATABASE_URL` | `jdbc:mysql://HOST:4000/DB_NAME?useSSL=true&requireSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | Your TiDB username |
| `DB_PASSWORD` | Your TiDB password |
| `GEMINI_API_KEYS` | Your Gemini API keys (comma-separated) |
| `MAIL_USERNAME` | Gmail address (optional, for password reset) |
| `MAIL_PASSWORD` | Gmail app password (optional) |

> ⚠️ Use different `DATABASE_URL` for each service with the correct database name:
> - User Service: `fitnessapp_users`
> - Nutrition Service: `fitnessapp_nutrition`
> - Exercise Service: `fitnessapp_exercises`
> - Progress Service: `fitnessapp_progress`
> - Wellness Service: `fitnessapp_wellness`

### Step 3: Update Frontend API URL

After Render deploys your API Gateway, copy its URL (e.g., `https://fitnessapp-gateway.onrender.com`) and update:

- **Vercel**: Settings → Environment Variables → `EXPO_PUBLIC_API_URL` → Redeploy
- **Netlify**: Site settings → Environment variables → Redeploy
- **GitHub Pages**: Settings → Variables → Actions → Update `API_URL` → Re-run workflow

---

## 🧪 Test Your Deployment

```bash
# Test backend
curl https://fitnessapp-gateway.onrender.com/api/health

# Open frontend
open https://your-app.vercel.app
```

> **Note**: Render free tier sleeps after 15 min of inactivity. First request takes ~30-60 seconds to wake up. This is normal for free testing.

---

## 🔄 Auto-Deploy on Git Push

Once connected, every `git push origin main` will:
- ✅ Auto-deploy frontend (Vercel/Netlify) — instant
- ✅ Auto-deploy backend (Render) — ~5-10 min
- ✅ GitHub Pages via workflow — ~2 min

