@echo off
set ROOT=%~dp0..
set FRONTEND=%ROOT%\frontend
set BACKEND=%ROOT%\backend

echo Starting VectoRise Workforce Portal...
echo.

echo [1/2] Starting backend on http://127.0.0.1:8000
start "VectoRise Backend" cmd /k "cd /d %BACKEND% && set PYTHONPATH=.&& python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend on http://localhost:3000
if exist "%FRONTEND%\.next" rmdir /s /q "%FRONTEND%\.next"
start "VectoRise Frontend" cmd /k "cd /d %FRONTEND% && set WATCHPACK_POLLING=true&& npm run dev"

echo.
echo Open http://localhost:3000/login
echo See README.md for setup and credentials.
