@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     MDReader - Stop Services (Windows Batch)                 ║
REM ╚══════════════════════════════════════════════════════════════╝

echo.
echo ===============================================================
echo      MDReader - Stopping All Services (Windows)
echo ===============================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0stop-services.ps1"

