@echo off
REM ============================================================
REM  Agente de Impressao - Instalador de Auto-Start
REM  Pede elevacao (Admin) e executa setup-autostart.ps1
REM ============================================================

REM Verifica privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo Solicitando privilegios de Administrador...
    echo.
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo.
echo Executando instalador de auto-start...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-autostart.ps1"

echo.
pause
