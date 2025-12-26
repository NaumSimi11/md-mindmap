@echo off
REM ================================================================
REM      MDReader - Start Services (Windows Batch)
REM ================================================================
REM
REM Usage:
REM   start-services.bat              - Normal start
REM   start-services.bat --clean      - Clean database and start fresh
REM   start-services.bat --with-user  - Create test user after startup
REM
REM This script launches the PowerShell version with proper permissions.

echo.
echo ================================================================
echo      MDReader - Starting All Services (Windows)
echo ================================================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell not found! Please install PowerShell.
    pause
    exit /b 1
)

REM Parse arguments and convert to PowerShell format
set "PS_ARGS="
for %%a in (%*) do (
    if "%%a"=="--clean" set "PS_ARGS=%PS_ARGS% -Clean"
    if "%%a"=="-clean" set "PS_ARGS=%PS_ARGS% -Clean"
    if "%%a"=="--with-user" set "PS_ARGS=%PS_ARGS% -WithUser"
    if "%%a"=="-with-user" set "PS_ARGS=%PS_ARGS% -WithUser"
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0start-services.ps1" %PS_ARGS%

if %ERRORLEVEL% neq 0 (
    echo.
    echo ================================================================
    echo ERROR: Failed to start services. Check the output above.
    echo ================================================================
    pause
)
