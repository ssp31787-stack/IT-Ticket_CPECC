# ============================================================
#  CPECC IT SERVICE DESK - Background Service Manager & Tray Icon
# ============================================================
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectRoot = $PSScriptRoot
$logDir = "$projectRoot\logs"
$backendLog = "$logDir\backend.log"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# --- Configuration ---
$IconPath = "$projectRoot\frontend\public\cpecc-logo.png" # Fallback to standard if ICO missing
$Context = New-Object System.Windows.Forms.ContextMenu
$ExitItem = New-Object System.Windows.Forms.MenuItem("Stop & Exit", { Stop-All; $NotifyIcon.Visible = $false; exit })
$RestartItem = New-Object System.Windows.Forms.MenuItem("Restart Services", { Start-All })
$OpenPortalItem = New-Object System.Windows.Forms.MenuItem("Open IT Portal", { Start-Process "http://localhost:5000/admin" })
$Context.MenuItems.AddRange(@($OpenPortalItem, $RestartItem, $ExitItem))

$NotifyIcon = New-Object System.Windows.Forms.NotifyIcon
$NotifyIcon.Text = "CPECC IT Service Desk (Background)"
$NotifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -Id $PID).Path) # Default icon
$NotifyIcon.ContextMenu = $Context
$NotifyIcon.Visible = $true

function Show-Error($msg) {
    [System.Windows.Forms.MessageBox]::Show($msg, "CPECC IT System Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
}

function Stop-All {
    Write-Output "Stopping all services..."
    @(5000, 8080) | ForEach-Object {
        (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object {
            try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    Get-Process -Name "cloudflared", "devtunnel", "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-All {
    Stop-All
    Write-Output "Launching services in background..."
    
    # 1. Start START-ALL-SERVICES.ps1 hidden and headless
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$projectRoot\START-ALL-SERVICES.ps1`" -Headless" -WindowStyle Hidden
    
    # 2. Monitor health
    Start-Sleep -Seconds 15
    $check = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet
    if (-not $check) {
        $errorSnippet = ""
        if (Test-Path $backendLog) {
            $errorSnippet = Get-Content $backendLog -Tail 10 -ErrorAction SilentlyContinue
        }
        Show-Error "The IT Service Desk failed to start correctly on port 5000.`n`nLast Log Output:`n$errorSnippet"
    } else {
        $NotifyIcon.ShowBalloonTip(3000, "CPECC System Active", "IT Service Desk is running silently in the background.", [System.Windows.Forms.ToolTipIcon]::Info)
    }
}

# --- Initialization ---
Start-All

# Keep the script alive for the tray icon
while ($true) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 100
}
