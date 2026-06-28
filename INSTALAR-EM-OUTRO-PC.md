# 🖥️ Instalar o Agente em Outro Computador (via GitHub)

Guia para colocar o agente de impressão rodando, com auto-start no Windows, em
um PC novo a partir do repositório do GitHub.

Repositório: **https://github.com/optical3r/agente-local**

---

## ✅ Pré-requisitos (instalar uma vez no PC novo)

São as duas únicas coisas que **não** vêm do GitHub:

1. **Node.js (LTS)** — https://nodejs.org → baixar a versão **LTS** e instalar (next/next/finish).
2. **Git** — https://git-scm.com → instalar com as opções padrão.

> Para conferir se instalaram: abra o PowerShell e rode `node -v` e `git --version`.
> Os dois devem mostrar uma versão.

---

## 1️⃣ Clonar o repositório

Abra o **PowerShell** e rode:

```powershell
# Ir para onde quer instalar (ex.: Documentos)
cd $env:USERPROFILE\Documents

# Clonar
git clone https://github.com/optical3r/agente-local.git

# Entrar na pasta
cd agente-local
```

---

## 2️⃣ Rodar o instalador

**Duplo-clique em `INSTALAR.bat`** (ou clique direito → *Executar como administrador*).

O instalador pede elevação (UAC) — é normal, precisa para registrar o auto-start.
Ele faz tudo sozinho:

- Verifica o Node.js
- Instala o PM2 (se faltar)
- Roda `npm install` (baixa as dependências)
- Inicia o agente e salva o estado (`pm2 save`)
- Cria a Tarefa Agendada `AgenteImpressaoJackJango` (auto-start no logon)

Ao final, o agente já está rodando em **http://localhost:3000** e voltará sozinho
a cada ligar/reiniciar o PC.

---

## 3️⃣ Configurar as impressoras (IMPORTANTE)

⚠️ A configuração física das impressoras (`config.json`) **não vem pelo GitHub** —
cada loja tem IPs/portas diferentes. No PC novo as impressoras começam **sem
configuração**, então `/api/print` falha até você configurar. Há duas formas:

### Opção A — pelo PWA (recomendado)

Abra o PWA na loja, vá nas configurações de impressão e cadastre os IPs.
O PWA chama `/api/configure` e o agente persiste em `config.json`.

### Opção B — manual via PowerShell

Ajuste os IPs reais daquela loja e rode:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/configure -Method POST `
  -ContentType "application/json" `
  -Body '{"balcao":{"type":"i8_network","ip":"192.168.0.50","port":9100},"cozinha":{"type":"i8_network","ip":"192.168.0.51","port":9100}}'
```

Tipos aceitos: `i8_network` / `m8_internal` (rede, usa `ip` + `port`) ou
`usb` / `serial` (usa `port` = porta COM, ex.: `COM3`).
Para descobrir portas USB: `Invoke-RestMethod http://localhost:3000/api/ports`.

---

## 4️⃣ Validar a instalação

```powershell
# Agente respondendo?
curl http://localhost:3000/health
# Esperado: {"status":"online","agent_version":"1.1.0","uptime_seconds":...}

# Config gravada?
curl http://localhost:3000/api/config

# Teste de impressão (sai um cupom de teste na impressora do balcão)
Invoke-RestMethod -Uri http://localhost:3000/api/test/balcao -Method POST
```

### Confirmar o auto-start (sem reiniciar)

```powershell
pm2 kill
schtasks /Run /TN AgenteImpressaoJackJango
# aguarde alguns segundos
curl http://localhost:3000/health
# deve voltar a responder "online"
```

Para a prova definitiva: **reinicie o PC** e confira o `curl http://localhost:3000/health`
depois de fazer login no Windows.

---

## 🔄 Atualizar o agente nesse PC (no futuro)

Quando houver mudanças novas no GitHub:

```powershell
cd $env:USERPROFILE\Documents\agente-local
git pull
npm install
pm2 restart agente-impressao
pm2 save
```

A configuração das impressoras (`config.json`) é preservada — não é tocada pelo `git pull`.

---

## 🧰 Comandos úteis

| Ação | Comando |
|------|---------|
| Ver status | `pm2 status` |
| Ver logs | `pm2 logs agente-impressao` |
| Reiniciar | `pm2 restart agente-impressao` |
| Parar | `pm2 stop agente-impressao` |
| Remover auto-start | duplo-clique em `DESINSTALAR.bat` |

---

## 🐛 Problemas comuns

- **`node` ou `git` não reconhecido** → não foram instalados (ou feche/reabra o
  terminal após instalar, para o PATH atualizar).
- **`/api/print` retorna `"IP da ... não configurado"`** → falta o passo 3
  (configurar as impressoras).
- **Agente não voltou após reiniciar** → confira a tarefa:
  `Get-ScheduledTask -TaskName AgenteImpressaoJackJango` deve estar `Ready`.
  Se não existir, rode o `INSTALAR.bat` de novo como administrador.
- **`pm2 status` dá erro de pipe (EPERM)** → algum `pm2` foi iniciado elevado.
  Feche terminais, rode `pm2 kill` e reinicie pelo `INSTALAR.bat`.
