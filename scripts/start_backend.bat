@echo off
call "%~dp0kill_ports.bat"
cd /d C:\VectoRisePortal\backend
set PYTHONPATH=.
rem Local dev overrides (root .env points at production Neon)
set ENVIRONMENT=development
set SEED_DATABASE=1
set DATABASE_URL=sqlite:///./data/dashboard.db
set CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
