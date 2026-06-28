# ============================================================
#  Agente de Impressao - Instalacao de Auto-Start (Windows)
#  Cria uma Tarefa Agendada que roda "pm2 resurrect" no logon,
#  garantindo que o agente volte sozinho apos ligar/reiniciar.
# ============================================================

$ErrorActionPreference = 'Stop'
$TaskName  = 'AgenteImpressaoJackJango'
$AppDir    = $PSScriptRoot
$Pm2Cmd    = Join-Path $env:APPDATA 'npm\pm2.cmd'

function Write-Step($n, $msg) { Write-Host "[$n] $msg" -ForegroundColor Cyan }

Write-Host ''
Write-Host '============================================' -ForegroundColor Green
Write-Host ' AGENTE DE IMPRESSAO - AUTO-START (Windows)' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host ''
Write-Host "Diretorio do agente: $AppDir"
Write-Host ''

# --- 1. Pre-requisitos -----------------------------------------------------
Write-Step '1/6' 'Verificando Node.js e PM2...'

$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) {
    Write-Host '  [ERRO] Node.js nao encontrado. Instale em https://nodejs.org' -ForegroundColor Red
    exit 1
}
Write-Host "      Node: $($node.Source)"

if (-not (Test-Path $Pm2Cmd)) {
    Write-Host '      PM2 nao encontrado. Instalando globalmente...'
    & npm install -g pm2
    if ($LASTEXITCODE -ne 0) { Write-Host '  [ERRO] Falha ao instalar PM2' -ForegroundColor Red; exit 1 }
}
Write-Host "      PM2:  $Pm2Cmd"

# --- 2. Dependencias do projeto -------------------------------------------
Write-Step '2/6' 'Instalando dependencias do projeto (npm install)...'
Push-Location $AppDir
& npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Host '  [ERRO] npm install falhou' -ForegroundColor Red; exit 1 }

# --- 3. Pasta de logs ------------------------------------------------------
Write-Step '3/6' 'Garantindo pasta de logs...'
if (-not (Test-Path (Join-Path $AppDir 'logs'))) { New-Item -ItemType Directory -Path (Join-Path $AppDir 'logs') | Out-Null }

# --- 4. Iniciar agente e salvar estado ------------------------------------
Write-Step '4/6' 'Iniciando agente com PM2 e salvando estado...'
& $Pm2Cmd delete agente-impressao 2>$null | Out-Null
& $Pm2Cmd start (Join-Path $AppDir 'ecosystem.config.js')
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Host '  [ERRO] Falha ao iniciar o agente' -ForegroundColor Red; exit 1 }
& $Pm2Cmd save
Pop-Location

# --- 5. Criar Tarefa Agendada (resurrect no logon) ------------------------
Write-Step '5/6' 'Criando Tarefa Agendada de auto-start no logon...'

# Remove tarefa anterior, se existir
schtasks /Query /TN $TaskName *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host '      Removendo tarefa anterior...'
    schtasks /Delete /TN $TaskName /F | Out-Null
}

# Acao: pm2 resurrect (restaura o dump.pm2 salvo). Delay de 30s para a rede subir.
$action  = New-ScheduledTaskAction -Execute $Pm2Cmd -Argument 'resurrect'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Delay = 'PT30S'
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal `
    -Description 'Restaura o Agente de Impressao (PM2) ao iniciar/reiniciar o Windows' | Out-Null

Write-Host "      Tarefa '$TaskName' criada (gatilho: logon, +30s)."

# --- 6. Verificacao --------------------------------------------------------
Write-Step '6/6' 'Verificando...'
Start-Sleep -Seconds 2
& $Pm2Cmd status

Write-Host ''
Write-Host '============================================' -ForegroundColor Green
Write-Host ' INSTALACAO CONCLUIDA' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host ''
Write-Host 'O agente agora:'
Write-Host '  [OK] Inicia automaticamente ao ligar/reiniciar (logon)'
Write-Host '  [OK] Reinicia sozinho se travar (PM2 autorestart)'
Write-Host '  [OK] Roda em http://localhost:3000'
Write-Host ''
Write-Host 'Para testar o auto-start sem reiniciar o PC:'
Write-Host "  schtasks /Run /TN $TaskName"
Write-Host ''
Write-Host 'Comandos uteis:'
Write-Host '  pm2 status        - ver estado'
Write-Host '  pm2 logs          - ver logs'
Write-Host '  pm2 restart all   - reiniciar'
Write-Host ''
