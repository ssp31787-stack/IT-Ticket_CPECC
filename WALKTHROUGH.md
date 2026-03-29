# CPECC IT Service Desk Windows Installer Walkthrough

The application has been successfully converted into a fully self-contained standard Windows Setup installer (`.exe`). 

## 📦 What Was Built

The installer compiles the entire application stack:
- **Backend**: Node.js API with SQLite database configuration
- **Frontend**: Pre-compiled React static assets served from the backend
- **Evolution API**: The global WhatsApp bridge service
- **External Tools**: Ngrok (for webhook tunneling), NSSM (for Windows Service management)

## ✨ Features of the Installer

1. **One-Click Installation**
   Installs all components into `C:\Program Files\CPECC IT Service Desk` or an alternative directory chosen by the user. 
   Checks if Node.js (v18+) is installed, and seamlessly guides the user to install it if missing.

2. **Always-On Background Services**
   The installer automatically registers 3 discrete Windows Services using NSSM that run fully in the background (no console windows required) and start automatically as soon as Windows boots:
   - `CPECC-Backend`: The core ticketing system and web portal
   - `CPECC-Evolution`: The WhatsApp routing engine
   - `CPECC-Tunnel`: Ngrok to establish public webhook endpoints

3. **npm Dependency Handling**
   To bypass deep Windows MAX_PATH limitations, Node Modules are freshly `npm installed` locally on the destination machine automatically during the setup phase for both the backend and Evolution API.

4. **Shortcuts & Launchers**
   - Automatically drops an *"Open CPECC Portal"* shortcut natively on the user's Desktop with a custom icon.
   - Includes a seamless Launcher (`CPECC-Launcher.cmd`) that ensures all critical services are healthy and instantly opens the IT Service Desk Web Interface.
   - Includes a *“Stop All Services”* shortcut for graceful emergency application shutdown or restarts.

5. **Clean Uninstallation**
   If the user uninstalls via Windows "Add or Remove Programs", the uninstaller silently stops all background Windows processes, intelligently unregisters the 3 custom Windows services to prevent bloat, and fully removes local project files.

## 🚀 How to Run It

The compiled installer is ready for execution!

**Installer Location:**  
`C:\Users\cpeccadmin\.gemini\antigravity\scratch\qr-ticketing\dist\CPECC-IT-ServiceDesk-Setup.exe`

Double-clicking the installer will execute all the steps above and bind the services for 24x7 unattended background operation.
