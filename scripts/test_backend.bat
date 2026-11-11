@echo off
cd /d C:\VectoRisePortal\backend
set PYTHONPATH=.
python -c "from app.main import app; from app.database import init_db; init_db(); print('backend ok')"
