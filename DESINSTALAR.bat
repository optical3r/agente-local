@echo off
REM ============================================================
REM  Agente de Impressao - Desinstalar Auto-Start
REM ============================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando privilegios de Administrador...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo.
echo Removendo tarefa de auto-start...
schtasks /Delete /TN "AgenteImpressaoJackJango" /F 2>nul
if %errorLevel% equ 0 (
    echo   Tarefa removida.
) else (
    echo   Tarefa nao encontrada (ja removida).
)

echo.
echo Parando e removendo agente do PM2...
call pm2 delete agente-impressao 2>nul
call pm2 save --force 2>nul

echo.
echo Desinstalacao concluida. O agente NAO iniciara mais automaticamente.
echo.
pause
