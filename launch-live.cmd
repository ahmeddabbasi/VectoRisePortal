@echo off
echo Starting VectoRise Portal...
call "%~dp0scripts\kill_ports.bat"

start "VectoRise Backend" cmd /k "cd /d C:\VectoRisePortal\backend && set PYTHONPATH=.&& python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 4 /nobreak >nul

start "VectoRise Frontend" cmd /k "cd /d C:\VectoRisePortal\frontend && set WATCHPACK_POLLING=true&& npm run dev"

echo.
echo Backend:  http://127.0.0.1:8000/health
echo Frontend: http://localhost:3000/login
echo.
echo Two terminal windows should have opened. Wait ~15 seconds for Next.js to compile.
