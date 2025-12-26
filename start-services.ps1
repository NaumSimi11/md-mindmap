# MDReader - Service Startup Script (Windows PowerShell)
#
# Usage:
#   .\start-services.ps1              # Start with existing data
#   .\start-services.ps1 -Clean       # Clean database and start fresh
#   .\start-services.ps1 -WithUser    # Start and create test user
#
# Prerequisites:
#   - Docker Desktop for Windows (running)
#   - Node.js 18+ installed
#   - Python 3.10+ installed

param(
    [switch]$Clean,
    [switch]$WithUser
)

$ErrorActionPreference = "Stop"

# Configuration
$BACKEND_PORT = 7001
$FRONTEND_PORT = 5173
$POSTGRES_PORT = 5432
$REDIS_PORT = 6379
$HOCUSPOCUS_PORT = 1234
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backendv2"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$HOCUSPOCUS_DIR = Join-Path $PROJECT_ROOT "hocuspocus-server"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "      MDReader - Starting All Services (Windows)               " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    if (Test-Port $Port) {
        Write-Host "[WARN] Stopping existing $ServiceName on port $Port..." -ForegroundColor Yellow
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                     Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

# Function to wait for service
function Wait-ForService {
    param([string]$HostName, [int]$Port, [string]$ServiceName, [int]$MaxAttempts = 30)
    
    Write-Host "[INFO] Waiting for $ServiceName to be ready..." -ForegroundColor Blue
    $attempt = 0
    
    while ($attempt -lt $MaxAttempts) {
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect($HostName, $Port)
            $tcpClient.Close()
            Write-Host "[OK] $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        catch {
            $attempt++
            Start-Sleep -Seconds 1
        }
    }
    
    Write-Host "[ERROR] $ServiceName failed to start after $MaxAttempts seconds" -ForegroundColor Red
    return $false
}

# ----------------------------------------------------------------
# Step 1: Cleanup
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 1: Cleanup" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Stop-ProcessOnPort $BACKEND_PORT "Backend"
Stop-ProcessOnPort $FRONTEND_PORT "Frontend"
Stop-ProcessOnPort $HOCUSPOCUS_PORT "Hocuspocus"

# ----------------------------------------------------------------
# Step 2: Docker Services
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 2: Docker Services (PostgreSQL + Redis)" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

# Check if Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "[ERROR] Docker is not running! Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Starting Docker containers..." -ForegroundColor Blue
Set-Location $PROJECT_ROOT
docker compose up -d

if (-not (Wait-ForService "localhost" $POSTGRES_PORT "PostgreSQL")) { exit 1 }
if (-not (Wait-ForService "localhost" $REDIS_PORT "Redis")) { exit 1 }

# ----------------------------------------------------------------
# Step 3: Database Migrations
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 3: Database Migrations" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $BACKEND_DIR

# Create venv if not exists
if (-not (Test-Path "venv")) {
    Write-Host "[INFO] Creating Python virtual environment..." -ForegroundColor Blue
    python -m venv venv
}

# Activate venv and run migrations
Write-Host "[INFO] Running Alembic migrations..." -ForegroundColor Blue
$activateScript = Join-Path $BACKEND_DIR "venv\Scripts\Activate.ps1"
& $activateScript
pip install -r requirements.txt -q
alembic upgrade head
Write-Host "[OK] Migrations completed successfully" -ForegroundColor Green

# ----------------------------------------------------------------
# Step 4: Start Hocuspocus Server
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 4: Starting Hocuspocus Server" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $HOCUSPOCUS_DIR

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing Hocuspocus dependencies..." -ForegroundColor Blue
    npm install
}

Write-Host "[INFO] Starting Hocuspocus WebSocket server on port $HOCUSPOCUS_PORT..." -ForegroundColor Blue
$hocuspocusScript = "Set-Location '$HOCUSPOCUS_DIR'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $hocuspocusScript -WindowStyle Minimized
Start-Sleep -Seconds 3

if (-not (Wait-ForService "localhost" $HOCUSPOCUS_PORT "Hocuspocus WebSocket")) { exit 1 }

# ----------------------------------------------------------------
# Step 5: Start Backend
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 5: Starting Backend" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $BACKEND_DIR
Write-Host "[INFO] Starting FastAPI backend on port $BACKEND_PORT..." -ForegroundColor Blue

# Start backend in background
$backendScript = "Set-Location '$BACKEND_DIR'; & '$BACKEND_DIR\venv\Scripts\Activate.ps1'; uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Minimized

Start-Sleep -Seconds 5
if (-not (Wait-ForService "localhost" $BACKEND_PORT "Backend API")) { exit 1 }

# ----------------------------------------------------------------
# Step 6: Start Frontend
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 6: Starting Frontend" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $FRONTEND_DIR

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Blue
    npm install
}

Write-Host "[INFO] Starting React frontend on port $FRONTEND_PORT..." -ForegroundColor Blue

# Start frontend in background
$frontendScript = "Set-Location '$FRONTEND_DIR'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Minimized

Start-Sleep -Seconds 5
if (-not (Wait-ForService "localhost" $FRONTEND_PORT "Frontend")) { exit 1 }

# ----------------------------------------------------------------
# Done!
# ----------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "          ALL SERVICES STARTED SUCCESSFULLY!                   " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "SERVICE STATUS:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  [OK] PostgreSQL:  localhost:$POSTGRES_PORT" -ForegroundColor White
Write-Host "  [OK] Redis:       localhost:$REDIS_PORT" -ForegroundColor White
Write-Host "  [OK] Hocuspocus:  ws://localhost:$HOCUSPOCUS_PORT" -ForegroundColor White
Write-Host "  [OK] Backend:     http://localhost:$BACKEND_PORT" -ForegroundColor White
Write-Host "  [OK] Frontend:    http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host ""
Write-Host "OPEN YOUR BROWSER:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  http://localhost:$FRONTEND_PORT" -ForegroundColor Green
Write-Host ""
Write-Host "TO STOP ALL SERVICES:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  .\stop-services.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ready to go!" -ForegroundColor Green

# Return to project root
Set-Location $PROJECT_ROOT
