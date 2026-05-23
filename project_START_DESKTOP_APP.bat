@echo off
setlocal

cd /d "%~dp0gate-alert-desktop"

if not exist ".venv311\Scripts\python.exe" (
  echo Creating Python 3.11 virtual environment...
  py -3.11 -m venv .venv311
  if errorlevel 1 (
    echo.
    echo Python 3.11 is required. Install Python 3.11, then run this file again.
    pause
    exit /b 1
  )
)

echo Installing/updating dependencies...
".venv311\Scripts\python.exe" -m pip install --upgrade pip
".venv311\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo Dependency installation failed. Check the messages above.
  pause
  exit /b 1
)

echo.
echo Starting Baig House Gate Security System...
echo URL: http://localhost:8000
echo Login: Mirza Bilal / admin@gate2024
echo Admin PIN: 1234
echo.
".venv311\Scripts\python.exe" app.py

pause
