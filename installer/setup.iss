; ═══════════════════════════════════════════════════════════════════
; CPECC IT Service Desk — Windows Installer
; Build: "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss
; ═══════════════════════════════════════════════════════════════════

#define AppName    "CPECC IT Service Desk"
#define AppVersion "1.0.0"
#define AppPubl    "CPECC"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPubl}
AppPublisherURL=http://localhost:5000
DefaultDirName={autopf}\CPECC IT Service Desk
DefaultGroupName={#AppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=CPECC-IT-ServiceDesk-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
CloseApplications=yes
RestartIfNeededByRun=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create Desktop shortcut"
Name: "startupicon"; Description: "Auto-start tray when Windows logs in"

[Files]
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,*.sqlite,*.sqlite-journal,node_modules\*"
Source: "..\frontend\dist\*"; DestDir: "{app}\backend\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\evolution-api\*"; DestDir: "{app}\evolution-api"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,node_modules\*"
Source: "..\tools\nssm.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tools\ngrok.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "install-services.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "uninstall-services.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "tray.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "CPECC-Launcher.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "CPECC-Stop.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Open CPECC Portal"; Filename: "{app}\CPECC-Launcher.cmd"; WorkingDir: "{app}"
Name: "{group}\Stop All Services"; Filename: "{app}\CPECC-Stop.cmd"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\CPECC-Launcher.cmd"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{autostartup}\CPECC IT Service Desk"; Filename: "{app}\CPECC-Launcher.cmd"; WorkingDir: "{app}"; Tasks: startupicon

[Run]
Filename: "cmd.exe"; Parameters: "/c npm install --omit=dev"; WorkingDir: "{app}\backend"; Flags: runhidden waituntilterminated; StatusMsg: "Installing backend packages..."
Filename: "cmd.exe"; Parameters: "/c npm install --omit=dev"; WorkingDir: "{app}\evolution-api"; Flags: runhidden waituntilterminated; StatusMsg: "Installing Evolution API packages..."
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\install-services.ps1"" -InstallDir ""{app}"""; WorkingDir: "{app}"; Flags: runhidden waituntilterminated; StatusMsg: "Registering Windows services..."
Filename: "{app}\CPECC-Launcher.cmd"; Description: "Open CPECC IT Service Desk now"; Flags: postinstall shellexec nowait; WorkingDir: "{app}"

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\uninstall-services.ps1"" -InstallDir ""{app}"""; Flags: runhidden waituntilterminated; RunOnceId: "RemoveServices"

[Code]
function NodeInstalled(): Boolean;
begin
  Result := FileExists('C:\Program Files\nodejs\node.exe')
         or FileExists('C:\Program Files (x86)\nodejs\node.exe');
end;

function InitializeSetup(): Boolean;
begin
  if not NodeInstalled() then begin
    MsgBox(
      'Node.js v18 or later is required.' + #13#10 + #13#10 +
      'Please install it from https://nodejs.org then re-run this installer.',
      mbError, MB_OK);
    Result := False;
  end else
    Result := True;
end;
