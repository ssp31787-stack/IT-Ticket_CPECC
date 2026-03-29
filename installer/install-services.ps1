# install-services.ps1
# ─────────────────────────────────────────────────────────────────────────────
# CPECC IT Service Desk – Windows Service Installer
# Run once after copying files to the install directory.
# Installs backend + Evolution API as Windows services via NSSM.
# ─────────────────────────────────────────────────────────────────────────────
param (
    [string]$InstallDir = $PSScriptRoot
)

$nssm = "$InstallDir\nssm.exe"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
$npmPath = (Get-Command npm  -ErrorAction SilentlyContinue)?.Source
$BackendDir = "$InstallDir\backend"
$EvolutionDir = "$InstallDir\evolution-api"
$LogDir = "$InstallDir\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Install-Service($Name, $ExePath, $Args, $WorkDir, $LogFile) {
    # Remove existing service if present
    & $nssm stop  $Name 2>$null
    & $nssm remove $Name confirm 2>$null
    Start-Sleep -Seconds 1

    & $nssm install $Name $ExePath $Args
    & $nssm set     $Name AppDirectory   $WorkDir
    & $nssm set     $Name AppStdout      "$LogDir\$LogFile"
    & $nssm set     $Name AppStderr      "$LogDir\$LogFile"
    & $nssm set     $Name AppRotateFiles 1
    & $nssm set     $Name AppRotateBytes 5000000
    & $nssm set     $Name Start          SERVICE_AUTO_START
    & $nssm set     $Name ObjectName     LocalSystem
    Write-Host "[INSTALL] Service '$Name' registered." -ForegroundColor Green
}

# ── 1. Backend (port 5000) ───────────────────────────────────────────────────
if (-not $nodePath) {
    Write-Host "[ERROR] Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing CPECC-Backend service..." -ForegroundColor Cyan
Install-Service `
    -Name     "CPECC-Backend" `
    -ExePath  $nodePath `
    -Args     "server.js" `
    -WorkDir  $BackendDir `
    -LogFile  "backend.log"

# ── 2. Evolution API (port 8080) ─────────────────────────────────────────────
if (Test-Path $EvolutionDir) {
    Write-Host "Installing CPECC-Evolution service..." -ForegroundColor Cyan
    Install-Service `
        -Name     "CPECC-Evolution" `
        -ExePath  $nodePath `
        -Args     "dist/index.js" `
        -WorkDir  $EvolutionDir `
        -LogFile  "evolution.log"
}
else {
    Write-Host "[WARN] Evolution API folder not found at $EvolutionDir — skipping." -ForegroundColor Yellow
}

# ── 3. ngrok tunnel ──────────────────────────────────────────────────────────
$ngrokExe = "$InstallDir\ngrok.exe"
$ngrokDomain = ""
$envFile = "$BackendDir\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^NGROK_DOMAIN=(.+)") { $ngrokDomain = $Matches[1].Trim() }
    }
}

if (Test-Path $ngrokExe) {
    Write-Host "Installing CPECC-Tunnel service..." -ForegroundColor Cyan
    $ngrokArgs = if ($ngrokDomain) { "http --domain=$ngrokDomain 5000" } else { "http 5000" }
    Install-Service `
        -Name     "CPECC-Tunnel" `
        -ExePath  $ngrokExe `
        -Args     $ngrokArgs `
        -WorkDir  $InstallDir `
        -LogFile  "tunnel.log"
}

# ── Start all services ────────────────────────────────────────────────────────
Write-Host "" 
Write-Host "Starting services..." -ForegroundColor Cyan
foreach ($svc in @("CPECC-Evolution", "CPECC-Backend", "CPECC-Tunnel")) {
    $exists = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($exists) {
        Start-Service -Name $svc -ErrorAction SilentlyContinue
        Write-Host "  ✅ $svc started" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "  CPECC IT Service Desk services installed successfully!" -ForegroundColor Green
Write-Host "  All services will start automatically on Windows boot."   -ForegroundColor Green
Write-Host "  Portal: http://localhost:5000" -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor Green
