# Step 1 — Production Database (PostgreSQL)

## What you have now (local)

| Item | Location |
|------|----------|
| Dev database | `backend/data/dashboard.db` (SQLite file on your PC) |
| Not suitable for production | Single file, no backups, no remote access |

## What you need (production)

A **hosted PostgreSQL** database. Recommended: **Neon** (free tier, simple).

---

## A. Create Neon database

1. Go to [https://neon.tech](https://neon.tech) and sign up (GitHub login works).
2. Click **New Project**
   - Name: `vectorise-portal`
   - Region: pick closest to your users (e.g. `AWS Asia Pacific (Singapore)` or `US East`)
3. After creation, open **Dashboard → Connection details**
4. Copy the **connection string** (URI format), e.g.:

   ```
   postgresql://neondb_owner:AbCdEf123@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

5. Save this securely — you will use it as `DATABASE_URL`.

---

## B. Configure your local `.env`

In the project root, edit `.env` (create from `.env.example` if needed):

```env
DATABASE_URL=postgresql://YOUR_NEON_CONNECTION_STRING_HERE
ENVIRONMENT=production
SEED_DATABASE=true
JWT_SECRET=replace-with-openssl-rand-hex-32
ADMIN_EMAIL=admin@vectoriseinc.dev
ADMIN_PASSWORD=choose-a-strong-password-here
```

Generate JWT secret (PowerShell):

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use any long random string (32+ characters).

---

## C. Initialize the database (create tables + admin user)

From Command Prompt:

```cmd
cd C:\VectoRisePortal\backend
set PYTHONPATH=.
python scripts\setup_database.py
```

Expected output:

```
Connection: OK
Creating tables...
Tables created: 25 (...)
Seeding admin user and defaults...
Admin user: admin@yourcompany.com
Seed: OK
Database setup complete.
```

---

## D. Verify in Neon dashboard

1. Open Neon → your project → **SQL Editor**
2. Run:

```sql
SELECT email, role FROM users;
SELECT name FROM departments;
```

You should see your admin user and departments (Sales, Operations).

---

## E. After first successful setup

Set in `.env` (and later on your backend host):

```env
SEED_DATABASE=false
```

Never re-seed production unless you intend to reset data.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Connection FAILED: SSL required` | Add `?sslmode=require` to DATABASE_URL |
| `ModuleNotFoundError: psycopg2` | Run `pip install psycopg2-binary` |
| `JWT_SECRET must be set` | Set `ENVIRONMENT=development` for local test, or set a real JWT_SECRET |
| `postgres://` URL | Script accepts it; auto-converted to `postgresql://` |

---

## Next step

When database setup prints **OK**, proceed to **Step 2 — Backend** (`docs/DEPLOY-02-BACKEND.md`).
