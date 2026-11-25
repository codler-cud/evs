$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Starting EcoSort Backend (port 8000) and Frontend (port 5173)..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Cyan
