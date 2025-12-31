# MDReader - Service Startup Script (Windows PowerShell)
#
# Usage:
#   .\start-services.ps1              # Interactive mode selection
#   .\start-services.ps1 -Web         # Start in Web mode
#   .\start-services.ps1 -Tauri       # Start in Tauri (Desktop) mode
#   .\start-services.ps1 -Clean       # Clean database and start fresh
#   .\start-services.ps1 -WithUser    # Start and create test user
#
# Prerequisites:
#   - Docker Desktop for Windows (running)
#   - Node.js 18+ installed
#   - Python 3.10+ installed

param(
    [switch]$Clean,
    [switch]$WithUser,
    [switch]$Web,
    [switch]$Tauri
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

# Determine run mode
$RUN_MODE = ""
if ($Web) {
    $RUN_MODE = "web"
}
elseif ($Tauri) {
    $RUN_MODE = "tauri"
}

# ----------------------------------------------------------------
# Mode Selection (if not specified via args)
# ----------------------------------------------------------------
function Select-RunMode {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "          MDReader - Choose Your Environment                   " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Select how you want to run MDReader:" -ForegroundColor White
    Write-Host ""
    Write-Host "    [1]  " -ForegroundColor Green -NoNewline
    Write-Host "Web Mode" -ForegroundColor White -NoNewline
    Write-Host "         (Browser - Vite dev server)" -ForegroundColor DarkGray
    Write-Host "    [2]  " -ForegroundColor Blue -NoNewline
    Write-Host "Tauri Mode" -ForegroundColor White -NoNewline
    Write-Host "       (Desktop App - Native window)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Tip: Use -Web or -Tauri flag to skip this prompt" -ForegroundColor DarkGray
    Write-Host ""
    
    while ($true) {
        $choice = Read-Host "  Enter your choice [1/2]"
        switch ($choice) {
            {$_ -in "1", "web", "w"} {
                Write-Host ""
                Write-Host "  Selected: Web Mode" -ForegroundColor Green
                return "web"
            }
            {$_ -in "2", "tauri", "t", "desktop", "d"} {
                Write-Host ""
                Write-Host "  Selected: Tauri Desktop Mode" -ForegroundColor Blue
                return "tauri"
            }
            default {
                Write-Host "  Invalid choice. Please enter 1 or 2." -ForegroundColor Red
            }
        }
    }
}

# Show mode selection if not specified
if (-not $RUN_MODE) {
    $RUN_MODE = Select-RunMode
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
if ($RUN_MODE -eq "tauri") {
    Write-Host "     MDReader - Starting Services (Tauri Desktop Mode)        " -ForegroundColor Cyan
} else {
    Write-Host "     MDReader - Starting Services (Web Mode)                  " -ForegroundColor Cyan
}
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($Clean) {
    Write-Host "[INFO] Clean mode enabled - will reset database" -ForegroundColor Yellow
}
if ($WithUser) {
    Write-Host "[INFO] Will create test user after startup" -ForegroundColor Yellow
}

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
        foreach ($procId in $processes) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
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
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
}
catch {
    Write-Host "[ERROR] Docker is not running! Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Set-Location $PROJECT_ROOT

# Clean database if requested
if ($Clean) {
    Write-Host "[INFO] Cleaning database (docker-compose down -v)..." -ForegroundColor Yellow
    docker compose down -v 2>$null
}

Write-Host "[INFO] Starting Docker containers..." -ForegroundColor Blue
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
Write-Host "[INFO] Installing Python dependencies..." -ForegroundColor Blue
$activateScript = Join-Path $BACKEND_DIR "venv\Scripts\Activate.ps1"
& $activateScript
pip install -r requirements.txt -q

Write-Host "[INFO] Running Alembic migrations..." -ForegroundColor Blue
$env:PYTHONPATH = $BACKEND_DIR
alembic upgrade head

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Migrations completed successfully" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Migration failed" -ForegroundColor Red
    exit 1
}

# ----------------------------------------------------------------
# Step 4: Create Test User (if requested)
# ----------------------------------------------------------------
if ($WithUser -or $Clean) {
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor White
    Write-Host "  Step 4: Creating Test User" -ForegroundColor White
    Write-Host "----------------------------------------------------------------" -ForegroundColor White
    
    Write-Host "[INFO] Creating test user..." -ForegroundColor Blue
    $env:PYTHONPATH = $BACKEND_DIR
    python scripts/create_test_users.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Test user created" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] User may already exist (continuing...)" -ForegroundColor Yellow
    }
}

# ----------------------------------------------------------------
# Step 5: Start Hocuspocus Server
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 5: Starting Hocuspocus Server" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $HOCUSPOCUS_DIR

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing Hocuspocus dependencies..." -ForegroundColor Blue
    npm install
}

Write-Host "[INFO] Starting Hocuspocus WebSocket server on port $HOCUSPOCUS_PORT..." -ForegroundColor Blue

# Set environment variables for Hocuspocus
$hocuspocusScript = @"
Set-Location '$HOCUSPOCUS_DIR'
`$env:HOCUSPOCUS_PORT = '$HOCUSPOCUS_PORT'
`$env:HOCUSPOCUS_HOST = '0.0.0.0'
`$env:NODE_ENV = 'development'
npm start
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $hocuspocusScript -WindowStyle Minimized

# Give Hocuspocus more time to start on Windows
Start-Sleep -Seconds 5

if (-not (Wait-ForService "localhost" $HOCUSPOCUS_PORT "Hocuspocus WebSocket" 45)) { 
    Write-Host "[WARN] Hocuspocus may still be starting. Check the Hocuspocus window for errors." -ForegroundColor Yellow
    Write-Host "[INFO] Common issues on Windows:" -ForegroundColor Yellow
    Write-Host "  - Run 'npm install' manually in hocuspocus-server folder" -ForegroundColor Gray
    Write-Host "  - Check if port 1234 is blocked by firewall" -ForegroundColor Gray
    Write-Host "  - Try running 'npm start' manually in hocuspocus-server" -ForegroundColor Gray
}

# ----------------------------------------------------------------
# Step 6: Start Backend
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  Step 6: Starting Backend" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $BACKEND_DIR
Write-Host "[INFO] Starting FastAPI backend on port $BACKEND_PORT..." -ForegroundColor Blue

# Start backend in background
$backendScript = "Set-Location '$BACKEND_DIR'; `$env:PYTHONPATH='$BACKEND_DIR'; & '$BACKEND_DIR\venv\Scripts\Activate.ps1'; uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Minimized

Start-Sleep -Seconds 5
if (-not (Wait-ForService "localhost" $BACKEND_PORT "Backend API")) { exit 1 }

# ----------------------------------------------------------------
# Step 7: Start Frontend (Web or Tauri)
# ----------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor White
if ($RUN_MODE -eq "tauri") {
    Write-Host "  Step 7: Starting Tauri Desktop App" -ForegroundColor White
} else {
    Write-Host "  Step 7: Starting Frontend (Web)" -ForegroundColor White
}
Write-Host "----------------------------------------------------------------" -ForegroundColor White

Set-Location $FRONTEND_DIR

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Blue
    npm install
}

if ($RUN_MODE -eq "tauri") {
    Write-Host "[INFO] Starting Tauri Desktop Application..." -ForegroundColor Blue
    Write-Host "       (This will open a native desktop window)" -ForegroundColor DarkGray
    
    # Start Tauri in background (it handles its own dev server)
    $tauriScript = "Set-Location '$FRONTEND_DIR'; npm run tauri:dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $tauriScript -WindowStyle Normal
    
    # Wait a bit for Tauri to start (it takes longer than web)
    Write-Host "[INFO] Waiting for Tauri to initialize..." -ForegroundColor Blue
    Start-Sleep -Seconds 10
    
    if (-not (Wait-ForService "localhost" $FRONTEND_PORT "Tauri Dev Server" 60)) { 
        Write-Host "[WARN] Tauri may still be starting. Check the Tauri window for errors." -ForegroundColor Yellow
    }
    
    Write-Host "[OK] Tauri Desktop App is launching!" -ForegroundColor Green
} else {
    Write-Host "[INFO] Starting React frontend on port $FRONTEND_PORT..." -ForegroundColor Blue
    
    # Start frontend in background
    $frontendScript = "Set-Location '$FRONTEND_DIR'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Minimized
    
    Start-Sleep -Seconds 5
    if (-not (Wait-ForService "localhost" $FRONTEND_PORT "Frontend")) { exit 1 }
}

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
if ($RUN_MODE -eq "tauri") {
    Write-Host "  [OK] Tauri:       Desktop App" -ForegroundColor Blue
} else {
    Write-Host "  [OK] Frontend:    http://localhost:$FRONTEND_PORT" -ForegroundColor White
}
Write-Host ""

Write-Host "MODE:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
if ($RUN_MODE -eq "tauri") {
    Write-Host "  Tauri Desktop Mode - Native window should open automatically" -ForegroundColor Blue
} else {
    Write-Host "  Web Mode - Open in browser: http://localhost:$FRONTEND_PORT" -ForegroundColor Green
}
Write-Host ""

if ($WithUser -or $Clean) {
    Write-Host "TEST CREDENTIALS:" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------------" -ForegroundColor White
    Write-Host "  Email:    naum@example.com" -ForegroundColor White
    Write-Host "  Password: Kozuvcanka#1" -ForegroundColor White
    Write-Host ""
}

Write-Host "TO STOP ALL SERVICES:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  .\stop-services.ps1" -ForegroundColor White
Write-Host ""
Write-Host "USAGE:" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor White
Write-Host "  .\start-services.ps1              # Interactive mode" -ForegroundColor Gray
Write-Host "  .\start-services.ps1 -Web         # Web mode" -ForegroundColor Gray
Write-Host "  .\start-services.ps1 -Tauri       # Tauri desktop mode" -ForegroundColor Gray
Write-Host "  .\start-services.ps1 -Clean       # Clean DB and start fresh" -ForegroundColor Gray
Write-Host "  .\start-services.ps1 -WithUser    # Create test user" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready to go!" -ForegroundColor Green

# Return to project root
Set-Location $PROJECT_ROOT
