@echo off
cd /d "C:\Users\Blood\Documents\git-repos\Projekt_001\python-backend"
call "C:\Users\Blood\Documents\git-repos\Projekt_001\venv\Scripts\activate.bat"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
pause