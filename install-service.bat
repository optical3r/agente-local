@echo off
REM ============================================================
REM  [OBSOLETO] Este metodo usava pm2-windows-service, que e
REM  instavel no Windows 11 e NAO ressuscitava o agente apos
REM  reiniciar o PC. Use o novo instalador: INSTALAR.bat
REM ============================================================

echo.
echo Este instalador foi substituido.
echo Use INSTALAR.bat (auto-start via Tarefa Agendada + pm2 resurrect).
echo.
echo Abrindo o instalador novo...
timeout /t 2 >nul

call "%~dp0INSTALAR.bat"
