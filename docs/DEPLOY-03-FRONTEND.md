# Step 3 — Frontend (Free: Vercel)

## A. Prerequisites

- Backend deployed and healthy (see `DEPLOY-02-BACKEND.md`)
- Backend URL, e.g. `https://vectorise-api.onrender.com`
- Code on GitHub

---

## B. Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New → Project** → import your repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |

4. **Environment Variables** (required):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://vectorise-api.onrender.com` |

   ⚠️ No trailing slash. Must be `https://` in production.

5. Click **Deploy**

Vercel gives you a URL like `https://vectorise-portal.vercel.app`

---

## C. Update backend CORS

Go back to **Render dashboard** → your API service → Environment:

```
CORS_ORIGINS=https://vectorise-portal.vercel.app,https://vectorise-portal-xxx.vercel.app
```

Include both the production domain and preview URLs if you use branch deploys.

Redeploy the backend (or it auto-restarts on env change).

---

## D. Verify end-to-end

1. Open `https://your-app.vercel.app/login`
2. Log in with admin credentials
3. Check browser DevTools → Network — API calls should go to your Render URL (not `localhost`)
4. Test check-in, tasks, sales pages

---

## E. Custom domain (optional)

**Vercel:** Project → Settings → Domains → add `portal.yourcompany.com`

**Render:** Settings → Custom Domains → add `api.yourcompany.com`

Then update:

- `NEXT_PUBLIC_API_URL=https://api.yourcompany.com`
- `CORS_ORIGINS=https://portal.yourcompany.com`

Redeploy both.

---

## F. Production checklist

- [ ] `ENVIRONMENT=production` on backend
- [ ] `SEED_DATABASE=false` on backend (after first seed)
- [ ] Strong `JWT_SECRET` and `ADMIN_PASSWORD`
- [ ] `CORS_ORIGINS` matches exact Vercel URL(s)
- [ ] `NEXT_PUBLIC_API_URL` points to Render backend
- [ ] Neon `DATABASE_URL` with `?sslmode=require`
- [ ] Google JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` (if using sales sync)
- [ ] Change admin password after first login

---

## Architecture

```
User browser
    ↓
Vercel (Next.js frontend)     — FREE
    ↓  API calls
Render (FastAPI backend)      — FREE
    ↓
Neon (PostgreSQL)             — FREE
    ↓
Google Sheets (sales sync)    — optional
```
