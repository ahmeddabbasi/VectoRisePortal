# VectoRise Workforce Portal

Dual-portal HRM and workforce management system with integrated sales operations dashboard.

- **Admin portal** — employees, attendance, schedules, tasks, exceptions, reports, evaluations, departments, audit log, internal chat, sales analytics
- **Employee portal** — check-in/out, schedule, tasks, performance, exceptions, notifications, profile, chat

## Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, APScheduler |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (production) |
| Auth | JWT bearer tokens |

---

## Quick Start (Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- (Optional) Google service account JSON for sales sync

### 1. Configure environment

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Edit `.env` — defaults work for local development.

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

### 3. Start servers

**Windows (recommended if project is on OneDrive):**

```cmd
scripts\start-dev-junction.cmd
```

**Or manually:**

```bash
# Terminal 1 — backend
cd backend
set PYTHONPATH=.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open **http://localhost:3000/login**

Development seeds an admin user and demo employees automatically (`SEED_DATABASE=true`).

---

## Production Deployment

### Environment variables (required)

| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | Set to `production` |
| `JWT_SECRET` | Long random string (min 32 chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Your frontend URL(s), comma-separated |
| `ADMIN_EMAIL` | Bootstrap admin email (first seed only) |
| `ADMIN_PASSWORD` | Bootstrap admin password (first seed only) |
| `NEXT_PUBLIC_API_URL` | Public backend URL for the frontend build |

### Docker Compose (recommended)

```bash
# Create production env
cp .env.example .env
# Edit .env — set JWT_SECRET, ADMIN_PASSWORD, POSTGRES_PASSWORD, CORS_ORIGINS

# First deploy — seed admin + defaults
SEED_DATABASE=true docker compose up -d --build

# Subsequent deploys
docker compose up -d --build
```

Services:

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| Health check | — | http://localhost:8000/health |

### Manual production bootstrap

```bash
cd backend
ENVIRONMENT=production SEED_DATABASE=true python seed_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Operational checklist

- [ ] Set strong `JWT_SECRET` and `ADMIN_PASSWORD`
- [ ] Use PostgreSQL (`DATABASE_URL=postgresql://...`)
- [ ] Set `CORS_ORIGINS` to your production domain
- [ ] Place Google service account JSON in `credentials/` (if using sales sync)
- [ ] Configure reverse proxy (nginx/Caddy) with HTTPS
- [ ] Set `SEED_DATABASE=false` after first deploy
- [ ] Schedule database backups (PostgreSQL volume `pgdata`)
- [ ] Verify daily jobs run (APScheduler, default 23:00 UTC)
- [ ] Change all default passwords after first login
- [ ] Monitor `/health` endpoint

### Scheduled jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily HRM jobs | 23:00 UTC (configurable) | Lock schedules, detect missing checkouts/absences |
| Google Sheets sync | Every 15 min (configurable) | Sync sales leads (requires credentials) |

Manual trigger: Admin → Schedules → **Run Daily Jobs**

---

## Project Structure

```
backend/
  app/
    api/          # Route modules (auth, admin, employee, hrm, sales, chat)
    models/       # SQLAlchemy models
    services/     # Business logic
    core/         # Auth dependencies
  seed_db.py      # Manual database seeding
frontend/
  app/
    admin/        # Admin portal pages
    employee/     # Employee portal pages
    login/        # Authentication
scripts/          # Dev and utility scripts
docker-compose.yml
```

---

## API Documentation

Available in development at **http://127.0.0.1:8000/docs** (disabled in production).

Key endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Authenticate |
| `GET /api/auth/me` | Current user |
| `GET /api/admin/*` | Admin operations |
| `GET /api/employee/*` | Employee self-service |
| `GET /api/hrm/*` | HRM admin operations |
| `GET /api/chat/*` | Internal messaging |
| `GET /health` | Health check |

---

## Security Notes

- JWT tokens are stored in `localStorage` — use HTTPS in production
- Change default passwords immediately after seeding
- Profile photos stored in `backend/uploads/` (Docker volume `uploads`)
- API docs hidden when `ENVIRONMENT=production`
- Session expiry triggers automatic redirect to login (401 handler)

---

## License

Proprietary — VectoRise Inc.
