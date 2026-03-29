# ============================================================
#  CPECC IT SERVICE DESK - One-Click Startup
#  Right-click -> "Run with PowerShell"
# ============================================================
$HOST.UI.RawUI.WindowTitle = "CPECC IT Service Desk - All Services"

$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

$projectRoot = $PSScriptRoot
$backendDir = "$projectRoot\backend"
$frontendDir = "$projectRoot\frontend"
$evolutionDir = "C:\Users\cpeccadmin\AppData\Roaming\npm\node_modules\evolution-api"
$logDir = "$projectRoot\logs"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Load saved public URL
$tunnelConfigFile = "$projectRoot\tunnel-id.txt"
$savedPublicUrl = ""
if (Test-Path $tunnelConfigFile) {
    $savedPublicUrl = (Get-Content $tunnelConfigFile -Raw).Trim()
    Write-Host "Public URL loaded: $savedPublicUrl" -ForegroundColor Green
}
else {
    Write-Host "No saved public URL. Run SETUP-PUBLIC-URL.ps1 first!" -ForegroundColor Yellow
}

# ---- Build frontend to dist/ ----
Write-Host "Building frontend for production..." -ForegroundColor Cyan
Set-Location $frontendDir
npm run build 2>&1 | Out-File "$logDir\build.log"
Write-Host "Frontend built." -ForegroundColor Green
Set-Location $projectRoot

# ---- Stop any old running processes ----
Write-Host "Cleaning up old processes..." -ForegroundColor Yellow
@(5000, 5678, 8080) | ForEach-Object {
    $port = $_
    (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object {
        try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
    }
}
# Kill old tunnel processes
Get-Process -Name "cloudflared", "devtunnel" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# ---- Start all services ----
Write-Host "Starting all services..." -ForegroundColor Green

# 1. Evolution API
Write-Host "[1/3] Evolution API..." -ForegroundColor Yellow
$jobEvolution = Start-Job -Name "EvolutionAPI" -ScriptBlock {
    param($dir, $log)
    Set-Location $dir
    & npm start *>> $log
} -ArgumentList $evolutionDir, "$logDir\evolution.log"
Start-Sleep -Seconds 2

# 2. Backend (Express + serves React frontend on port 5000)
Write-Host "[2/3] Backend + Frontend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; node server.js *>> '$logDir\backend.log'" -WindowStyle Minimized
Start-Sleep -Seconds 4

# 3. ngrok (permanent fixed public URL - no login required)
Write-Host "[3/3] ngrok public tunnel..." -ForegroundColor Yellow
$ngrokExe = "$projectRoot\tools\ngrok.exe"
# Read ngrok domain from .env
$ngrokDomain = ""
if (Test-Path "$backendDir\.env") {
    $envLines = Get-Content "$backendDir\.env"
    foreach ($line in $envLines) {
        if ($line -match "^NGROK_DOMAIN=(.+)") { $ngrokDomain = $Matches[1].Trim() }
    }
}
if ($ngrokDomain) {
    Start-Process -FilePath $ngrokExe -ArgumentList "http --domain=$ngrokDomain 5000" -WindowStyle Hidden
}
else {
    # Fallback: temporary URL (run SETUP-PUBLIC-URL.ps1 to get a permanent one)
    Start-Process -FilePath $ngrokExe -ArgumentList "http 5000" -WindowStyle Hidden
    Write-Host "  No NGROK_DOMAIN found. Run SETUP-PUBLIC-URL.ps1 for a permanent URL." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# ---- Extract public URL ----
function Get-PublicURL {
    # Use the saved permanent URL first
    if ($savedPublicUrl) { return $savedPublicUrl }
    # Fallback: try to read ngrok URL from tunnel log
    if (Test-Path "$logDir\tunnel.log") {
        $content = Get-Content "$logDir\tunnel.log" -Raw -ErrorAction SilentlyContinue
        $match = [regex]::Match($content, 'https://[\w\-]+\.ngrok[\-free]*\.app')
        if ($match.Success) { return $match.Value }
        $match2 = [regex]::Match($content, 'https://[\w\-]+\.devtunnels\.ms')
        if ($match2.Success) { return $match2.Value }
    }
    return "(run SETUP-PUBLIC-URL.ps1 first)"
}

# Open browser on local URL now
Start-Process "http://localhost:5000/admin"

# ---- Banner ----
function Write-Banner($publicUrl) {
    Clear-Host
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host "   CPECC IT SERVICE DESK - ALL SERVICES RUNNING" -ForegroundColor Cyan
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  LOCAL ACCESS" -ForegroundColor DarkGray
    Write-Host "  Ticket Form  : http://localhost:5000" -ForegroundColor White
    Write-Host "  Admin Portal : http://localhost:5000/admin" -ForegroundColor White
    Write-Host "  N8N          : http://localhost:5678" -ForegroundColor White
    Write-Host "  Evolution API: http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "  PUBLIC ACCESS (from anywhere in the world)" -ForegroundColor Green
    if ($publicUrl -ne "(generating...)") {
        Write-Host "  Ticket Form  : $publicUrl" -ForegroundColor Yellow
        Write-Host "  Admin Portal : $publicUrl/admin" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  ** Share the above URL with users worldwide! **" -ForegroundColor Green
    }
    else {
        Write-Host "  Public URL   : $publicUrl (check again in a few seconds)" -ForegroundColor Yellow
    }
    Write-Host ""
}

function Get-ServiceStatus($port) {
    try {
        $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($conn) { return "[RUNNING]" } else { return "[STARTING]" }
    }
    catch { return "[STARTING]" }
}

Write-Host ""
Write-Host "Press CTRL+C to stop all services." -ForegroundColor Red

try {
    while ($true) {
        $publicUrl = Get-PublicURL
        Write-Banner $publicUrl

        Write-Host "  SERVICE STATUS" -ForegroundColor DarkGray
        Write-Host "  -----------------------------------------------" -ForegroundColor DarkGray
        Write-Host ("  Evolution API (8080) : " + (Get-ServiceStatus 8080)) -ForegroundColor $(if ((Get-ServiceStatus 8080) -eq "[RUNNING]") { "Green" } else { "Yellow" })
        Write-Host ("  Backend+Frontend (5000) : " + (Get-ServiceStatus 5000)) -ForegroundColor $(if ((Get-ServiceStatus 5000) -eq "[RUNNING]") { "Green" } else { "Yellow" })
        Write-Host ("  Cloudflare Tunnel   : " + $(if ($publicUrl -ne "(generating...)") { "[ACTIVE] $publicUrl" } else { "[STARTING]" })) -ForegroundColor $(if ($publicUrl -ne "(generating...)") { "Green" } else { "Yellow" })

        Write-Host ""
        Write-Host "  -- Backend Log (last 5 lines) --" -ForegroundColor DarkCyan
        if (Test-Path "$logDir\backend.log") {
            Get-Content "$logDir\backend.log" -Tail 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }

        Write-Host ""
        Write-Host "  -- Tunnel Log (last 3 lines) --" -ForegroundColor DarkCyan
        if (Test-Path "$logDir\tunnel.log") {
            Get-Content "$logDir\tunnel.log" -Tail 3 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }

        Write-Host ""
        Write-Host "  Logs: $logDir" -ForegroundColor DarkGray
        Write-Host "  Press CTRL+C to stop everything." -ForegroundColor DarkGray

        Start-Sleep -Seconds 10
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping all services..." -ForegroundColor Red
    Get-Job -Name "EvolutionAPI", "Backend", "NgrokTunnel" -ErrorAction SilentlyContinue | Stop-Job -PassThru | Remove-Job
    Get-Process -Name "cloudflared", "devtunnel", "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    @(5000, 8080) | ForEach-Object {
        (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object {
            try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    Write-Host "All services stopped." -ForegroundColor Green
}

