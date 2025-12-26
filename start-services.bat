@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     MDReader - Start Services (Windows Batch)                ║
REM ╚══════════════════════════════════════════════════════════════╝
REM
REM This script launches the PowerShell version with proper permissions.
REM If you have issues, run PowerShell as Administrator and execute:
REM   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

echo.
echo ===============================================================
echo      MDReader - Starting All Services (Windows)
echo ===============================================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell not found! Please install PowerShell.
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0start-services.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo ===============================================================
    echo ERROR: Failed to start services. Check the output above.
    echo ===============================================================
    pause
)

