@echo off
title EcoSort Launcher
echo Starting EcoSort Backend (port 8000) and Frontend (port 5173)...

start "EcoSort Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
ping -n 3 127.0.0.1 >nul
start "EcoSort Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both servers are starting. Open http://localhost:5173 in your browser.
