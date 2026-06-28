# 🖨️ Agente Local de Impressão - Elgin i8

Servidor Node.js que recebe requisições HTTP do navegador e imprime em impressoras Elgin i8 via ESC/POS TCP/IP.

**✅ AUTO-INICIA COM O WINDOWS** (usando PM2)

> 📦 **Instalando em um PC novo a partir do GitHub?**
> Siga o guia [INSTALAR-EM-OUTRO-PC.md](INSTALAR-EM-OUTRO-PC.md).

---

## 🚀 Instalação Rápida

### **Como Serviço Windows** (inicia automaticamente)

```bash
# Como Administrador:
cd agente-impressao-local
.\install-service.bat
```

**Pronto!** Agora reinicia automaticamente com o PC.

### **Manual** (precisa iniciar toda vez)

```bash
npm install
npm start
```

Veja instalação completa: [INSTALL.md](INSTALL.md)

---

## 📡 API Endpoints

### GET /health

Verifica se o agente está online.

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "online",
  "agent_version": "1.1.0",
  "uptime_seconds": 123
}
```

### POST /api/configure

Configura as impressoras (balcão e cozinha).

**Request:**
```json
{
  "balcao": {
    "type": "i8_network",
    "ip": "192.168.1.100",
    "port": 9100
  },
  "cozinha": {
    "type": "i8_network",
    "ip": "192.168.1.101",
    "port": 9100
  }
}
```

### POST /api/print

Imprime um pedido.

**Request:**
```json
{
  "destination": "cozinha",
  "type": "order",
  "data": {
    "pizzariaName": "Pizzaria Exemplo",
    "orderNumber": "123",
    "items": [
      {
        "quantity": 1,
        "name": "Pizza Calabresa",
        "total": 45.00,
        "observations": "Sem cebola"
      }
    ],
    "total": 45.00,
    "payment": {
      "method": "Dinheiro"
    }
  },
  "options": {
    "cutPaper": true,
    "feedLines": 3
  }
}
```

**Destination:** `"balcao"`, `"cozinha"` ou `"ambos"`

### POST /api/test/balcao

Testa a impressora do balcão.

### POST /api/test/cozinha

Testa a impressora da cozinha.

### GET /api/status

Verifica status das impressoras.

### GET /api/config

Retorna a configuração atual.

---

## 🖨️ Comandos ESC/POS (Validados)

Baseado em:
- [Elgin Developer Community](https://elgindevelopercommunity.github.io/)
- [ESC/POS Standard](https://escpos.readthedocs.io/)

| Comando | Hex | Descrição |
|---------|-----|-----------|
| Inicializar | `1B 40` | Reseta impressora |
| Cortar papel | `1D 56 01` | Corte parcial |
| Abrir gaveta | `1B 70 00 19 FA` | Pulso 25ms/250ms |
| Avançar papel | `1B 64 [n]` | n linhas (1-255) |
| Alinhar esquerda | `1B 61 00` | Alinhamento |
| Alinhar centro | `1B 61 01` | Alinhamento |
| Negrito on | `1B 45 01` | Liga negrito |
| Negrito off | `1B 45 00` | Desliga negrito |

### Sequência de Impressão

```
1. Enviar CMD_INIT (reseta)
2. Aguardar 50ms
3. Enviar alinhamento
4. Enviar texto (UTF-8)
5. Aguardar 100ms
6. Enviar feed/cut/drawer
7. Aguardar 200ms
8. Finalizar conexão
```

---

## 💻 Integração com PWA

### Exemplo JavaScript

```javascript
// Configurar impressoras
async function configurarImpressoras() {
  const response = await fetch('http://localhost:3000/api/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      balcao: { type: 'i8_network', ip: '192.168.1.100', port: 9100 },
      cozinha: { type: 'i8_network', ip: '192.168.1.101', port: 9100 }
    })
  });
  return await response.json();
}

// Imprimir pedido
async function imprimirPedido(pedido, destino = 'cozinha') {
  const response = await fetch('http://localhost:3000/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: destino,
      type: 'order',
      data: {
        pizzariaName: 'Minha Pizzaria',
        orderNumber: pedido.numero,
        items: pedido.itens,
        total: pedido.total,
        payment: { method: pedido.pagamento }
      },
      options: {
        cutPaper: true,
        feedLines: 3
      }
    })
  });
  return await response.json();
}
```

---

## 🔧 Estrutura do Projeto

```
agente-impressao-local/
├── package.json              - Dependências
├── server.js                 - API HTTP Express
├── printer.js                - Lógica ESC/POS TCP/IP (validado)
├── formatter.js              - Formatação de cupons (32 colunas)
├── ecosystem.config.js       - Configuração PM2
├── config.json               - Config persistente (criado auto)
│
├── install-service.bat       - Instalar como serviço Windows
├── uninstall-service.bat     - Desinstalar serviço
├── start-manual.bat          - Iniciar manualmente
│
├── logs/                     - Logs PM2
│   ├── error.log             - Apenas erros
│   ├── out.log               - Saída normal
│   └── combined.log          - Tudo junto
│
├── README.md                 - Este arquivo
├── INSTALL.md                - Guia de instalação completo
└── GUIA-RAPIDO.md            - Setup rápido
```

---

## 🛠️ Comandos PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs agente-impressao

# Reiniciar
pm2 restart agente-impressao

# Parar
pm2 stop agente-impressao

# Monitor
pm2 monit
```

Ou use os scripts npm:

```bash
npm run pm2:status
npm run pm2:logs
npm run pm2:restart
```

---

## 📊 Logs

Quando rodando com PM2, os logs são salvos em:

```
logs/
├── error.log       - Apenas erros
├── out.log         - Saída normal
└── combined.log    - Tudo junto
```

Ver logs:

```bash
# Tempo real
pm2 logs agente-impressao

# Arquivos
type logs\combined.log
```

---

## ⚙️ Configurações

- **Porta HTTP:** 3000 (localhost)
- **Porta impressora:** 9100 (padrão ESC/POS)
- **Timeout conexão:** 5 segundos
- **Timeout leitura:** 10 segundos
- **CORS:** Habilitado para todos
- **Encoding:** UTF-8
- **Largura cupom:** 32 colunas (58mm)
- **Auto-restart:** PM2 (se travar)
- **Auto-start:** PM2 Windows Service

---

## 🔍 Troubleshooting

### Agente não inicia automaticamente

1. Verifique se instalou como Admin
2. Reinstale: `.\install-service.bat`
3. Teste: `pm2 status`

### Erro "EADDRINUSE"

Porta 3000 em uso. Altere em `ecosystem.config.js`:

```javascript
env: {
  PORT: 3001
}
```

### Impressora não imprime

1. Teste conexão: `ping 192.168.1.100`
2. Teste porta: `Test-NetConnection -ComputerName 192.168.1.100 -Port 9100`
3. Teste agente: `POST /api/test/cozinha`
4. Veja logs: `pm2 logs agente-impressao`

Veja mais: [INSTALL.md](INSTALL.md)

---

## 📝 Formato do Payload

```javascript
{
  destination: 'cozinha',  // 'balcao', 'cozinha' ou 'ambos'
  type: 'order',
  data: {
    pizzariaName: 'Nome da Pizzaria',
    cnpj: '00.000.000/0000-00',
    address: 'Endereço completo',
    phone: '(00) 0000-0000',
    city: 'Cidade',
    state: 'UF',
    orderNumber: '123',
    senha: '456',
    items: [
      {
        quantity: 1,
        name: 'Nome do produto',
        total: 45.00,
        observations: 'Observações'
      }
    ],
    total: 45.00,
    payment: {
      method: 'Dinheiro',
      paid: 50.00,
      change: 5.00
    },
    observations: 'Observações gerais',
    footer: 'Mensagem de rodapé'
  },
  options: {
    cutPaper: true,
    feedLines: 3,
    openDrawer: false
  }
}
```

---

## ✅ Características

- ✅ **Auto-inicia com Windows** (PM2)
- ✅ **Auto-reinicia se travar** (PM2 watch)
- ✅ **Logs persistentes** (./logs/)
- ✅ **Comandos ESC/POS validados** (documentação oficial)
- ✅ **Sequência otimizada** (delays corretos)
- ✅ **Timeout robusto** (5s conexão, 10s leitura)
- ✅ **Error handling completo**
- ✅ **UTF-8 encoding**
- ✅ **CORS habilitado**
- ✅ **Config persistente** (config.json)
- ✅ **Suporte multi-impressora** (balcão + cozinha)
- ✅ **Formato 32 colunas** (58mm)

---

## 📚 Documentação

- [INSTALL.md](INSTALL.md) - Guia de instalação completo
- [GUIA-RAPIDO.md](GUIA-RAPIDO.md) - Setup rápido e exemplos

## 📞 Referências

- [Elgin Developer Community](https://elgindevelopercommunity.github.io/)
- [ESC/POS Standard](https://escpos.readthedocs.io/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

## 📄 Licença

MIT

---

**Desenvolvido para PWA com impressoras Elgin i8 via ESC/POS TCP/IP** 🖨️
