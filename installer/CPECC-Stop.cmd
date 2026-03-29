@echo off
:: CPECC IT Service Desk — Stop All Services
title CPECC IT Service Desk - Stopping...
echo ============================================================
echo   Stopping CPECC IT Service Desk Services
echo ============================================================
sc stop CPECC-Tunnel   >nul 2>&1 && echo [OK] Tunnel stopped
sc stop CPECC-Backend  >nul 2>&1 && echo [OK] Backend stopped
sc stop CPECC-Evolution >nul 2>&1 && echo [OK] Evolution API stopped
echo.
echo All services stopped.
timeout /t 3 /nobreak >nul
