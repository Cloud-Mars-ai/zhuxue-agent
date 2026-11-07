@echo off
setlocal
chcp 65001 >nul

set "PROJECT_ROOT=%~dp0"
set "LAUNCHER=%PROJECT_ROOT%frontend\scripts\start-local.ps1"

if not exist "%LAUNCHER%" (
  echo [ERROR] Launcher not found:
  echo %LAUNCHER%
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%" %*
if errorlevel 1 pause

endlocal
