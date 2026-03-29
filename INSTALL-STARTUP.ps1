# ============================================================
#  CPECC IT SERVICE DESK - Install to Windows Startup (Background)
#  Right-click -> "Run with PowerShell"
# ============================================================

$projectRoot = $PSScriptRoot
$batPath = "$projectRoot\Run-IT-ServiceDesk.bat"
$vbsPath = "$projectRoot\hidden-launcher.vbs"
$startupPath = [System.Environment]::GetFolderPath('Startup')
$shortcutPath = "$startupPath\CPECC-IT-ServiceDesk.lnk"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "   INSTALLING IT SERVICE DESK TO RUN IN BACKGROUND ON BOOT" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Creating hidden launcher script..." -ForegroundColor Yellow

# Create the VBScript that runs the BAT file completely hidden (0 = vbHide)
$vbsScript = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$batPath" & Chr(34), 0
Set WshShell = Nothing
"@
$vbsScript | Out-File $vbsPath -Encoding Default

Write-Host "2. Adding shortcut to Windows Startup folder..." -ForegroundColor Yellow

# Create the Shortcut in shell:startup
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$vbsPath`""
$Shortcut.WorkingDirectory = $projectRoot
$Shortcut.Description = "CPECC IT ServiceDesk Background Process"
$Shortcut.IconLocation = "$projectRoot\frontend\public\cpecc-logo.png"
$Shortcut.Save()

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "   SUCCESS! INSTALLATION COMPLETE." -ForegroundColor Green
Write-Host ""
Write-Host "   Every time you turn on this PC, the IT Service Desk will" -ForegroundColor White
Write-Host "   silently launch in the background. The public link" -ForegroundColor White
Write-Host "   will automatically become live, and WhatsApp will connect!" -ForegroundColor White
Write-Host ""
Write-Host "   To uninstall this in the future, simply delete the shortcut:" -ForegroundColor Gray
Write-Host "   $shortcutPath" -ForegroundColor DarkGray
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
