@echo off
TITLE CPECC IT Service Desk
COLOR 0B

echo =======================================================
echo    CPECC IT Service Desk - Initializing...
echo =======================================================
echo.
echo Launching the service controller...
echo.

:: Run the PowerShell script and bypass execution policy
powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Normal -File "%~dp0START-ALL-SERVICES.ps1"

:: If the powershell script crashes or is closed, pause so the user can see any errors
pause
