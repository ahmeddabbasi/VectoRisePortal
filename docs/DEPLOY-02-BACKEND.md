# Step 2 — Backend (Free: Render)

## Recommended stack (all have free tiers)

| Service | Role | Free tier | Notes |
|---------|------|-----------|-------|
| **Vercel** | Frontend (Next.js) | Yes | Best for Next.js — see `DEPLOY-03-FRONTEND.md` |
| **Neon** | PostgreSQL database | Yes | You may already have this — see `DEPLOY-01-DATABASE.md` |
| **Render** | FastAPI backend | Yes | **Recommended** — Docker deploy, easy setup |
| Fly.io | FastAPI backend | Limited free | Better if you need persistent file storage |
| Railway | FastAPI backend | Trial credits only | Not truly free long-term |

**Why Render for this project:** Your backend is FastAPI + Docker. Render runs the existing `backend/Dockerfile` with no code changes. Vercel cannot host this API as a long-running Python server (only serverless functions).

### Render free tier caveats

- Service **spins down after ~15 min** of no traffic → first request after idle takes ~30–60s (cold start)
- **Ephemeral disk** — profile photo uploads are lost on redeploy (fine for MVP; use S3 later if needed)
- **750 instance-hours/month** — enough for one small app

---

## A. Prerequisites

1. Neon database ready (`DATABASE_URL` from `DEPLOY-01-DATABASE.md`)
2. Code pushed to **GitHub** (Render deploys from git)
3. Google service account JSON content (for sales sync) — optional

---

## B. Deploy on Render

1. Go to [https://render.com](https://render.com) → Sign up (GitHub login)
2. **New → Blueprint** → connect your GitHub repo
3. Render detects `render.yaml` — review and apply
4. Set these **secret** environment variables in the Render dashboard:

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | 32+ char random string (Render can auto-generate) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (set after Vercel deploy) |
| `ADMIN_EMAIL` | `admin@vectoriseinc.dev` |
| `ADMIN_PASSWORD` | Strong password (only used if `SEED_DATABASE=true`) |
| `GOOGLE_SPREADSHEET_ID` | Your spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste full JSON file contents (one line) |

5. For **first deploy only**, set `SEED_DATABASE=true`, deploy, verify login works, then set back to `false`.

**Manual alternative (no Blueprint):**

- New → **Web Service** → connect repo
- Runtime: **Docker**
- Dockerfile path: `backend/Dockerfile`
- Docker context: `.` (repo root)
- Health check path: `/health`

---

## C. Verify backend

```bash
curl https://vectorise-api.onrender.com/health
```

Expected:

```json
{"status":"ok","app":"VectoRise Workforce Portal","environment":"production"}
```

Save your backend URL — you need it for Vercel:

```
https://vectorise-api.onrender.com
```

---

## D. First-time database seed (if tables empty)

**Option 1 — Render env var (easiest)**

1. Set `SEED_DATABASE=true` in Render dashboard
2. Manual Deploy → wait for restart
3. Set `SEED_DATABASE=false`
4. Deploy again

**Option 2 — Local script against Neon**

```cmd
cd C:\VectoRisePortal\backend
set PYTHONPATH=.
set DATABASE_URL=postgresql://your-neon-url?sslmode=require
set ENVIRONMENT=production
set SEED_DATABASE=true
set JWT_SECRET=your-same-secret-as-render
python scripts\setup_database.py
```

---

## E. Google Sheets credentials on Render

Do **not** upload files. Paste the entire service account JSON into:

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

The app writes this to disk on startup automatically.

---

## F. Alternative: Fly.io (persistent uploads)

Use Fly.io if profile photos must survive redeploys:

- [https://fly.io](https://fly.io) — free allowance for small VMs
- Attach a **volume** at `/app/uploads`
- Same Docker image, set env vars in `fly secrets set`

More setup than Render; use when you outgrow Render's ephemeral disk.

---

## Next step

→ **Step 3 — Frontend on Vercel** (`docs/DEPLOY-03-FRONTEND.md`)
