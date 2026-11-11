@echo off
curl -s -o NUL -w "health: %%{http_code}\n" http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/health
echo.
curl -s -o NUL -w "login page: %%{http_code}\n" http://localhost:3000/login
curl -s -X POST http://127.0.0.1:8000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@vectoriseinc.dev\",\"password\":\"admin123\"}"
echo.
