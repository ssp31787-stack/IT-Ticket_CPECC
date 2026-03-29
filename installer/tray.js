// tray.js  — CPECC IT Service Desk System Tray Launcher
// Runs in the background after install, shows status in system tray.
// Starts Evolution API, Backend, and ngrok if they aren't running.
const path = require('path');
const { exec, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const INSTALL_DIR = path.dirname(process.execPath || __filename);
const BACKEND_DIR = path.join(INSTALL_DIR, 'backend');
const EVOLUTION_DIR = path.join(INSTALL_DIR, 'evolution-api');
const NGROK_EXE = path.join(INSTALL_DIR, 'ngrok.exe');
const LOG_DIR = path.join(INSTALL_DIR, 'logs');

fs.mkdirSync(LOG_DIR, { recursive: true });

// ── Read .env ─────────────────────────────────────────────────────────────────
function readEnv() {
    const envPath = path.join(BACKEND_DIR, '.env');
    const env = {};
    try {
        fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
            const [k, ...v] = line.split('=');
            if (k) env[k.trim()] = v.join('=').trim();
        });
    } catch { }
    return env;
}

// ── Check if a port is open ───────────────────────────────────────────────────
function checkPort(port) {
    return new Promise(resolve => {
        const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1500 }, () => resolve(true));
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

// ── Start a background process ────────────────────────────────────────────────
function startProcess(cmd, args, cwd, logFile) {
    const log = fs.openSync(path.join(LOG_DIR, logFile), 'a');
    const proc = spawn(cmd, args, {
        cwd,
        stdio: ['ignore', log, log],
        detached: false,
        windowsHide: true
    });
    proc.on('error', err => console.error(`[LAUNCHER] Failed to start ${cmd}:`, err.message));
    return proc;
}

// ── Service status polling ────────────────────────────────────────────────────
const processes = {};

async function ensureServicesRunning() {
    const env = readEnv();
    const nodeExe = process.execPath.includes('tray')
        ? 'node'
        : process.execPath;
    const actualNode = path.join(INSTALL_DIR, 'node.exe');
    const nodeCmd = fs.existsSync(actualNode) ? actualNode : 'node';

    // 1. Evolution API (port 8080)
    if (!(await checkPort(8080)) && !processes['evolution']) {
        console.log('[LAUNCHER] Starting Evolution API...');
        const evoIndex = path.join(EVOLUTION_DIR, 'dist', 'index.js');
        const evolLog = path.join(EVOLUTION_DIR, '.env');
        if (fs.existsSync(evoIndex)) {
            processes['evolution'] = startProcess(nodeCmd, ['dist/index.js'], EVOLUTION_DIR, 'evolution.log');
            processes['evolution'].on('exit', () => { delete processes['evolution']; });
        }
    }

    // 2. Backend (port 5000) — wait for Evolution API to start first
    if (!(await checkPort(5000)) && !processes['backend']) {
        console.log('[LAUNCHER] Starting Backend...');
        processes['backend'] = startProcess(nodeCmd, ['server.js'], BACKEND_DIR, 'backend.log');
        processes['backend'].on('exit', () => { delete processes['backend']; });
    }

    // 3. ngrok tunnel
    if (fs.existsSync(NGROK_EXE) && !processes['ngrok']) {
        const domain = env['NGROK_DOMAIN'] || '';
        const ngrokArgs = domain
            ? ['http', `--domain=${domain}`, '5000']
            : ['http', '5000'];
        processes['ngrok'] = startProcess(NGROK_EXE, ngrokArgs, INSTALL_DIR, 'tunnel.log');
        processes['ngrok'].on('exit', () => { delete processes['ngrok']; });
        console.log('[LAUNCHER] ngrok started.');
    }
}

// ── Systray (via Windows Script Host fallback if no native module) ────────────
// We use a simple popup menu via PowerShell tray icon
function createTrayMenu() {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$icon = [System.Drawing.SystemIcons]::Information
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $icon
$tray.Text = "CPECC IT Service Desk"
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$openItem = New-Object System.Windows.Forms.ToolStripMenuItem
$openItem.Text = "Open Admin Portal"
$openItem.add_Click({ Start-Process "http://localhost:5000/admin" })
$menu.Items.Add($openItem)

$statusItem = New-Object System.Windows.Forms.ToolStripMenuItem
$statusItem.Text = "Check Status..."
$statusItem.add_Click({ Start-Process "http://localhost:5000/api/health" })
$menu.Items.Add($statusItem)

$sep = New-Object System.Windows.Forms.ToolStripSeparator
$menu.Items.Add($sep)

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem
$exitItem.Text = "Exit Tray (services keep running)"
$exitItem.add_Click({ $tray.Visible = $false; [System.Windows.Forms.Application]::Exit() })
$menu.Items.Add($exitItem)

$tray.ContextMenuStrip = $menu
$tray.add_DoubleClick({ Start-Process "http://localhost:5000/admin" })
$tray.BalloonTipTitle = "CPECC IT Service Desk"
$tray.BalloonTipText = "All services running. Double-click to open portal."
$tray.ShowBalloonTip(4000)

[System.Windows.Forms.Application]::Run()
    `;

    const scriptPath = path.join(LOG_DIR, 'tray-icon.ps1');
    fs.writeFileSync(scriptPath, script, 'utf8');

    spawn('powershell.exe', [
        '-WindowStyle', 'Hidden',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
    ], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('[LAUNCHER] CPECC IT Service Desk Launcher starting...');

// Start tray icon
createTrayMenu();

// Start services immediately, then poll every 15 seconds
ensureServicesRunning();
setInterval(ensureServicesRunning, 15000);

// After 5s, open the admin portal in the browser
setTimeout(() => {
    exec('start http://localhost:5000/admin');
}, 5000);

// Keep alive
process.stdin.resume();
