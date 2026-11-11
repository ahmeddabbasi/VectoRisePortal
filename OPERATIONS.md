# Operations Guide — VectoRise Workforce Portal

## Day-1 Go-Live

1. **Deploy** using Docker Compose (see README.md)
2. **Seed** with `SEED_DATABASE=true` on first run only
3. **Log in** as admin and change password immediately
4. **Create employees** via Admin → Employees (min 8-char passwords)
5. **Configure settings** via Admin → Settings (grace periods, work hours)
6. **Verify** daily jobs: Admin → Schedules → Run Daily Jobs (manual test)
7. **Optional:** Add Google service account for sales sync

## Daily Operations

| Task | Who | How |
|------|-----|-----|
| Review attendance | Admin | Admin → Attendance |
| Resolve exceptions | Admin | Admin → Exceptions |
| Review schedule changes | Admin | Admin → Schedules |
| Assign tasks | Admin | Admin → Tasks |
| Run performance calc | Admin | Admin → Reports → Calculate |
| HR evaluations | Admin | Admin → Evaluations |

Employees self-serve: check-in/out, schedules, tasks, exceptions, chat.

## Monitoring

- **Health:** `GET /health` — returns `status: ok`
- **Logs:** `docker compose logs -f backend`
- **Database:** PostgreSQL volume `pgdata` — back up daily

## Backups

```bash
# PostgreSQL backup
docker compose exec db pg_dump -U vectorise vectorise > backup_$(date +%Y%m%d).sql

# Uploads (profile photos)
docker compose cp backend:/app/uploads ./uploads_backup
```

## Updates

```bash
git pull
docker compose up -d --build
```

Set `SEED_DATABASE=false` for all updates after initial deploy.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on all requests | Token expired — re-login |
| CORS errors | Set `CORS_ORIGINS` to exact frontend URL |
| Sales sync fails | Check `credentials/google-service-account.json` |
| OneDrive file watcher crash | Use `scripts/start-dev-junction.cmd` |
| Missing tables | Restart backend (runs `init_db`) or run `python seed_db.py` |

## Security Rotation

- Rotate `JWT_SECRET` quarterly (invalidates all sessions)
- Enforce password changes via Admin → Employees
- Review audit log monthly: Admin → Audit Log
