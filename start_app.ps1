Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting AI Document Intelligence & Learning Assistant..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\backend"
Start-Process "http://127.0.0.1:8000"
python -m uvicorn app:app --host 127.0.0.1 --port 8000
