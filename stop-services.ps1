# ╔══════════════════════════════════════════════════════════════╗
# ║     MDReader - Stop All Services (Windows PowerShell)        ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "SilentlyContinue"

$BACKEND_PORT = 7001
$FRONTEND_PORT = 5173
$HOCUSPOCUS_PORT = 1234

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║          MDReader - Stopping All Services                    ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Stopped $ServiceName (port $Port)" -ForegroundColor Green
    } else {
        Write-Host "⚪ $ServiceName was not running" -ForegroundColor Gray
    }
}

Write-Host "🛑 Stopping services..." -ForegroundColor Blue
Write-Host ""

Stop-ProcessOnPort $FRONTEND_PORT "Frontend"
Stop-ProcessOnPort $BACKEND_PORT "Backend"
Stop-ProcessOnPort $HOCUSPOCUS_PORT "Hocuspocus"

Write-Host ""
Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Blue
docker compose down 2>$null

Write-Host ""
Write-Host "✅ All services stopped!" -ForegroundColor Green
Write-Host ""

