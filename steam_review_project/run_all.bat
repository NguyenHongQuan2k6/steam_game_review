@echo off
title Steam Sentiment Analysis System - End-to-End Runner
cd /d "%~dp0"

echo =======================================================================
echo          Steam Sentiment Analysis System - End-to-End Runner
echo =======================================================================
echo.

:: Stage 1: Check Python and install dependencies
echo [1/4] Checking Python environment and installing dependencies...
python --version >nul 2>&1
if %errorlevel% neq 0 goto :no_python

echo.
echo Installing python dependencies from requirements.txt...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 goto :pip_warn
goto :stage2

:no_python
echo [ERROR] Python is not installed or not added to your system PATH.
echo Please install Python 3.10+ and select "Add Python to PATH".
echo.
pause
exit /b 1

:pip_warn
echo [WARNING] Failed to install some Python packages. Proceeding anyway...
echo.

:stage2
:: Stage 2: Check Node.js and build React frontend
echo [2/4] Checking Node.js environment and compiling React frontend...
node --version >nul 2>&1
if %errorlevel% neq 0 goto :no_node

echo Node.js found. Preparing React app...
cd src\web\frontend_new
if not exist node_modules call npm install
echo Building production bundles (npm run build)...
call npm run build
cd ..\..\..
goto :stage3

:no_node
echo [WARNING] Node.js/npm is not found in PATH.
echo Skipping React compilation and utilizing pre-built assets in dist/ directory.
echo.

:stage3
echo.

:: Stage 3: Run pipeline and launch server
echo [3/4] Running Pipeline Runner (checks database and runs ML steps if needed)...
python run_pipeline_all.py
if %errorlevel% neq 0 goto :pipeline_err
goto :stage4

:pipeline_err
echo.
echo [ERROR] Pipeline runner failed or exited with errors.
pause
exit /b %errorlevel%

:stage4
echo.
echo [4/4] Project terminated successfully.
pause
