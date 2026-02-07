@echo off
REM Quick Start Script for AI Orchestrator (Windows)
REM This script sets up and runs the AI Orchestrator server

echo ================================================================
echo.
echo         TravelOps AI Orchestrator - Quick Start
echo.
echo ================================================================
echo.

REM Check Python
echo Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo Python found!
echo.

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo Dependencies installed!
echo.

REM Create .env file
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo .env file created
) else (
    echo .env file already exists
)
echo.

REM Start server
echo ================================================================
echo                     STARTING SERVER
echo ================================================================
echo.
echo Server will be available at:
echo   * API: http://localhost:8000
echo   * Docs: http://localhost:8000/docs
echo   * ReDoc: http://localhost:8000/redoc
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
