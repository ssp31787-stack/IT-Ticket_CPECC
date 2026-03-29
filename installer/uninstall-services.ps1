# uninstall-services.ps1
# Removes all CPECC Windows services (called by Inno Setup uninstaller)
param([string]$InstallDir = $PSScriptRoot)
$nssm = "$InstallDir\nssm.exe"
foreach ($svc in @("CPECC-Tunnel", "CPECC-Backend", "CPECC-Evolution")) {
    & $nssm stop   $svc 2>$null
    & $nssm remove $svc confirm 2>$null
    Write-Host "Removed service: $svc"
}
