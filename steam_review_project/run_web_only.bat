@echo off
title Steam Sentiment Analysis - Web Server Only
cd /d "%~dp0"
echo =======================================================================
echo          Steam Sentiment Analysis - Web Server Only
echo =======================================================================
echo.
echo Starting Web App Server (Bypassing crawling and training steps)...
python run.py --serve
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the server. Please ensure python dependencies are installed.
)
pause
