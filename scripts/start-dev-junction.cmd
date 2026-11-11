@echo off
REM Use this if OneDrive path causes Next.js file-watcher issues
if not exist C:\VectoRisePortal (
  mklink /J C:\VectoRisePortal "%~dp0.."
)
set FRONTEND=C:\VectoRisePortal\frontend
set BACKEND=C:\VectoRisePortal\backend

echo Starting via C:\VectoRisePortal junction...
start "VectoRise Backend" cmd /k "cd /d %BACKEND% && set PYTHONPATH=.&& python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul
if exist "%FRONTEND%\.next" rmdir /s /q "%FRONTEND%\.next"
start "VectoRise Frontend" cmd /k "cd /d %FRONTEND% && set WATCHPACK_POLLING=true&& npm run dev"
echo Open http://localhost:3000/login
