# ============================================================
#  CPECC IT SERVICE DESK - One-Time ngrok Setup
#  Run this ONCE to configure your permanent free public URL
#  Right-click -> "Run with PowerShell"
# ============================================================

$ngrok = "$PSScriptRoot\tools\ngrok.exe"
$envFile = "$PSScriptRoot\backend\.env"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "   CPECC IT SERVICE DESK - Permanent URL Setup (ngrok)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "STEP 1: Get your free ngrok account (takes 2 minutes)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Open: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "  2. Sign up with Google/GitHub/Email (FREE)" -ForegroundColor White
Write-Host "  3. After login, go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "  4. Copy your auth token" -ForegroundColor White
Write-Host "  5. Go to: https://dashboard.ngrok.com/domains" -ForegroundColor White
Write-Host "  6. Click 'New Domain' - you get 1 FREE static domain" -ForegroundColor White
Write-Host "     (looks like: lucky-dog-happy.ngrok-free.app)" -ForegroundColor Gray
Write-Host ""

Start-Process "https://dashboard.ngrok.com/signup"
Write-Host "Browser opened to ngrok signup page." -ForegroundColor Green
Write-Host ""

# Get auth token from user
$token = Read-Host "Paste your ngrok Auth Token here"
$domain = Read-Host "Paste your ngrok Static Domain (e.g. lucky-dog-happy.ngrok-free.app)"

if (-not $token -or -not $domain) {
    Write-Host "Token and domain are required!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Save token to ngrok config
Write-Host ""
Write-Host "Configuring ngrok..." -ForegroundColor Cyan
& $ngrok config add-authtoken $token

# Save domain to .env file
$envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
if ($envContent -match "NGROK_DOMAIN=") {
    $envContent = $envContent -replace "NGROK_DOMAIN=.*", "NGROK_DOMAIN=$domain"
}
else {
    $envContent += "`nNGROK_DOMAIN=$domain"
}
$envContent | Set-Content $envFile -Encoding UTF8

# Save domain to tunnel-id.txt for easy display
$publicUrl = "https://$domain"
$publicUrl | Out-File "$PSScriptRoot\tunnel-id.txt" -Encoding UTF8

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETE! YOUR PERMANENT PUBLIC URL:" -ForegroundColor Green
Write-Host ""
Write-Host "   $publicUrl" -ForegroundColor Yellow
Write-Host "   Admin Portal: $publicUrl/admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "   This URL NEVER changes. Use it for your QR Code!" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run START-ALL-SERVICES.ps1 - no login needed ever again!" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close"
