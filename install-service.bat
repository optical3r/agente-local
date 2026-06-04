@echo off
echo.
echo ============================================
echo INSTALANDO AGENTE DE IMPRESSAO COMO SERVICO
echo ============================================
echo.

REM Verificar se está rodando como Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute este script como Administrador!
    echo Clique com botao direito e escolha "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/6] Criando pasta de logs...
if not exist "logs" mkdir logs
echo       Pasta logs\ criada

echo.
echo [2/6] Instalando PM2 globalmente...
call npm install -g pm2
if %errorLevel% neq 0 (
    echo [ERRO] Falha ao instalar PM2
    pause
    exit /b 1
)
echo       PM2 instalado com sucesso

echo.
echo [3/6] Instalando pm2-windows-service...
call npm install -g pm2-windows-service
if %errorLevel% neq 0 (
    echo [ERRO] Falha ao instalar pm2-windows-service
    pause
    exit /b 1
)
echo       pm2-windows-service instalado

echo.
echo [4/6] Instalando servico do Windows...
call pm2-service-install -n "AgentePrintJackJango"
if %errorLevel% neq 0 (
    echo [AVISO] Servico pode ja estar instalado
)
echo       Servico Windows configurado

echo.
echo [5/6] Iniciando agente com PM2...
call pm2 start ecosystem.config.js
if %errorLevel% neq 0 (
    echo [ERRO] Falha ao iniciar agente
    pause
    exit /b 1
)
echo       Agente iniciado

echo.
echo [6/6] Salvando configuracao PM2...
call pm2 save
echo       Configuracao salva

echo.
echo ============================================
echo INSTALACAO CONCLUIDA COM SUCESSO!
echo ============================================
echo.
echo O agente agora:
echo   [OK] Inicia automaticamente com o Windows
echo   [OK] Reinicia se travar
echo   [OK] Mantem logs em .\logs\
echo   [OK] Rodando em http://localhost:3000
echo.
echo Comandos uteis:
echo   pm2 status          - Ver status
echo   pm2 logs            - Ver logs em tempo real
echo   pm2 restart all     - Reiniciar
echo   pm2 stop all        - Parar
echo   pm2 monit           - Monitor interativo
echo.
echo Testando...
timeout /t 3 >nul
call pm2 status
echo.
pause
