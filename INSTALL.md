# 📦 Guia de Instalação Completo

## 🚀 Instalação como Serviço Windows (Recomendado)

### **Responde sua pergunta: SIM, inicia automaticamente após reiniciar!**

### Pré-requisitos

1. ✅ **Node.js 16+** instalado ([baixar](https://nodejs.org))
2. ✅ **Executar como Administrador**

### Instalação em 1 Clique

1. **Abra PowerShell como Administrador** (botão direito → Executar como administrador)

2. **Execute:**

```bash
cd c:\Users\rodri\Documents\Impressoras\agente-impressao-local
.\install-service.bat
```

3. **Pronto!** O agente agora:
   - ✅ Inicia automaticamente com o Windows
   - ✅ Reinicia se travar
   - ✅ Salva logs em `.\logs\`
   - ✅ Roda em `http://localhost:3000`

### Verificar se Está Rodando

```bash
pm2 status
```

Deve mostrar:

```
┌────┬────────────────────┬──────────┬──────┬───────────┐
│ id │ name               │ mode     │ ↺    │ status    │
├────┼────────────────────┼──────────┼──────┼───────────┤
│ 0  │ agente-impressao   │ fork     │ 0    │ online    │
└────┴────────────────────┴──────────┴──────┴───────────┘
```

Ou teste no navegador:

```
http://localhost:3000/health
```

---

## 📋 Instalação Manual (Sem Auto-Start)

Se não quiser que inicie automaticamente:

### 1. Instalar Dependências

```bash
cd agente-impressao-local
npm install
```

### 2. Iniciar Manualmente

```bash
npm start
```

Ou use o script:

```bash
.\start-manual.bat
```

**⚠️ Atenção:** Com este método, você precisa iniciar o agente manualmente sempre que ligar o PC.

---

## 🔄 Testando Auto-Start

### 1. Reinicie o computador

```bash
shutdown /r /t 0
```

### 2. Após reiniciar, verifique:

```bash
pm2 status
```

### 3. Teste no navegador:

```
http://localhost:3000/health
```

**✅ Se retornar `{"status":"ok"}`, está funcionando!**

---

## 🛠️ Comandos PM2

### Ver Status

```bash
pm2 status
```

### Ver Logs em Tempo Real

```bash
pm2 logs agente-impressao
```

Ou use o script npm:

```bash
npm run pm2:logs
```

### Reiniciar

```bash
pm2 restart agente-impressao
```

Ou:

```bash
npm run pm2:restart
```

### Parar

```bash
pm2 stop agente-impressao
```

### Monitor Interativo

```bash
pm2 monit
```

### Ver Logs Salvos

```bash
# Erros
type logs\error.log

# Saída normal
type logs\out.log

# Tudo junto
type logs\combined.log
```

---

## 🗑️ Desinstalar Serviço

Se quiser remover o auto-start:

```bash
.\uninstall-service.bat
```

Ou manualmente:

```bash
pm2 stop all
pm2 delete all
pm2-service-uninstall
pm2 save --force
```

---

## 🔧 Solução de Problemas

### "pm2: command not found"

Instale o PM2 globalmente:

```bash
npm install -g pm2
npm install -g pm2-windows-service
```

### Serviço não inicia automaticamente

1. Verifique se instalou como Admin:

```bash
net session
```

Se retornar erro, não está como Admin.

2. Reinstale o serviço:

```bash
.\uninstall-service.bat
.\install-service.bat
```

### "EADDRINUSE: address already in use"

Porta 3000 já está em uso. Altere no `ecosystem.config.js`:

```javascript
env: {
  PORT: 3001  // Altere para outra porta
}
```

E reinicie:

```bash
pm2 restart agente-impressao
```

### Logs não aparecem em .\logs\

Verifique se a pasta existe:

```bash
mkdir logs
```

E reinicie:

```bash
pm2 restart agente-impressao
```

---

## 📊 Estrutura de Logs

```
logs/
├── error.log       - Apenas erros
├── out.log         - Saída normal (console.log)
└── combined.log    - Tudo junto
```

Formato:

```
2026-06-03 21:30:00: [servidor] Agente iniciado
2026-06-03 21:30:05: [request] POST /api/print
2026-06-03 21:30:06: ✅ Impresso em 192.168.1.100:9100
```

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] PM2 instalado globalmente
- [ ] pm2-windows-service instalado
- [ ] Script `install-service.bat` executado como Admin
- [ ] `pm2 status` mostra "online"
- [ ] Teste de health retorna OK
- [ ] Reiniciou PC e agente iniciou automaticamente

---

## 🎯 Próximos Passos

Após instalação:

1. ✅ Configurar impressoras via `/api/configure`
2. ✅ Testar com `/api/test/cozinha`
3. ✅ Integrar com PWA

Veja [GUIA-RAPIDO.md](GUIA-RAPIDO.md) para exemplos de uso.

---

**Com PM2, o agente inicia AUTOMATICAMENTE após reiniciar o Windows!** ✅
