@echo off
:: CPECC IT Service Desk Launcher
:: Opens the admin portal and ensures all services are running.

setlocal
set INSTALLDIR=%~dp0
set NODE=node

:: Remove trailing backslash
if "%INSTALLDIR:~-1%"=="\" set INSTALLDIR=%INSTALLDIR:~0,-1%

title CPECC IT Service Desk

echo ============================================================
echo   CPECC IT Service Desk
echo ============================================================
echo.
echo Checking services...

:: Start Evolution API service if not running
sc query CPECC-Evolution >nul 2>&1
if %errorlevel%==0 (
    sc start CPECC-Evolution >nul 2>&1
) else (
    echo [WARN] CPECC-Evolution service not found. Starting manually...
    start /min "" cmd /c "cd /d "%INSTALLDIR%\evolution-api" && %NODE% dist\index.js >> "%INSTALLDIR%\logs\evolution.log" 2>&1"
    timeout /t 5 /nobreak >nul
)

:: Start Backend service if not running
sc query CPECC-Backend >nul 2>&1
if %errorlevel%==0 (
    sc start CPECC-Backend >nul 2>&1
) else (
    echo [WARN] CPECC-Backend service not found. Starting manually...
    start /min "" cmd /c "cd /d "%INSTALLDIR%\backend" && %NODE% server.js >> "%INSTALLDIR%\logs\backend.log" 2>&1"
    timeout /t 5 /nobreak >nul
)

:: Start ngrok tunnel service if registered
sc query CPECC-Tunnel >nul 2>&1
if %errorlevel%==0 (
    sc start CPECC-Tunnel >nul 2>&1
)

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

:: Open the admin portal
echo Opening Admin Portal...
start http://localhost:5000/admin

:: Start system tray icon (hidden window)
start /min "" %NODE% "%INSTALLDIR%\tray.js"

echo.
echo ============================================================
echo   Portal opened. Services are running in the background.
echo   You can close this window safely.
echo ============================================================
timeout /t 4 /nobreak >nul
