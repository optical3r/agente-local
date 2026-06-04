@echo off
echo.
echo ============================================
echo INICIANDO AGENTE (MODO MANUAL)
echo ============================================
echo.

echo Verificando Node.js...
where node >nul 2>nul
if %errorLevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

echo.
echo Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
    if %errorLevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias
        pause
        exit /b 1
    )
)
echo [OK] Dependencias instaladas

echo.
echo ============================================
echo AGENTE INICIANDO...
echo ============================================
echo.
echo Pressione Ctrl+C para parar
echo.

node server.js

pause
