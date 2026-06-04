@echo off
echo.
echo ============================================
echo DESINSTALANDO SERVICO DO AGENTE
echo ============================================
echo.

REM Verificar se está rodando como Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute este script como Administrador!
    pause
    exit /b 1
)

echo [1/3] Parando agente...
call pm2 stop all
call pm2 delete all
echo       Agente parado

echo.
echo [2/3] Removendo servico do Windows...
call pm2-service-uninstall
echo       Servico removido

echo.
echo [3/3] Limpando configuracao PM2...
call pm2 save --force
echo       Configuracao limpa

echo.
echo ============================================
echo DESINSTALACAO CONCLUIDA!
echo ============================================
echo.
echo Para reinstalar, execute: install-service.bat
echo.
pause
