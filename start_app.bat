@echo off
title AI Document Intelligence & Learning Assistant
echo ==========================================================
echo Starting AI Document Intelligence & Learning Assistant...
echo ==========================================================
cd /d "%~dp0backend"
start http://127.0.0.1:8000
python -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
