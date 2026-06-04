# 🚀 Guia Rápido - Agente Local de Impressão

## ⚡ Setup (3 passos)

### 1. Instalar

```bash
npm install
```

### 2. Iniciar

```bash
npm start
```

Deve aparecer:

```
🚀 ======================================
🚀 AGENTE LOCAL DE IMPRESSÃO
🚀 ======================================
🚀 Rodando em: http://localhost:3000
🚀 Health: http://localhost:3000/health
🚀 ======================================
```

### 3. Testar

Abra no navegador: `http://localhost:3000/health`

Deve retornar:

```json
{
  "status": "ok",
  "timestamp": "...",
  "version": "1.0.0"
}
```

---

## 🖨️ Configurar Impressoras

### Via curl/Postman:

```bash
curl -X POST http://localhost:3000/api/configure \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Via JavaScript (PWA):

```javascript
await fetch('http://localhost:3000/api/configure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    balcao: { type: 'i8_network', ip: '192.168.1.100', port: 9100 },
    cozinha: { type: 'i8_network', ip: '192.168.1.101', port: 9100 }
  })
});
```

---

## 🧪 Testar Impressora

### Balcão:

```bash
curl -X POST http://localhost:3000/api/test/balcao
```

### Cozinha:

```bash
curl -X POST http://localhost:3000/api/test/cozinha
```

**A impressora deve imprimir:**

```
================================
TESTE IMPRESSORA COZINHA
================================

Este é um teste de impressão.

Data/Hora: 03/06/2026 21:30:00

================================
```

---

## 📄 Imprimir Pedido

### Via curl:

```bash
curl -X POST http://localhost:3000/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "cozinha",
    "type": "order",
    "data": {
      "pizzariaName": "Minha Pizzaria",
      "orderNumber": "123",
      "items": [
        {
          "quantity": 1,
          "name": "Pizza Calabresa",
          "total": 45.00
        }
      ],
      "total": 45.00,
      "payment": { "method": "Dinheiro" }
    },
    "options": {
      "cutPaper": true,
      "feedLines": 3
    }
  }'
```

### Via JavaScript (PWA):

```javascript
async function imprimirPedido(pedido) {
  const response = await fetch('http://localhost:3000/api/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: 'cozinha',
      type: 'order',
      data: {
        pizzariaName: 'Minha Pizzaria',
        orderNumber: pedido.numero,
        items: pedido.itens.map(item => ({
          quantity: item.quantidade,
          name: item.nome,
          total: item.total,
          observations: item.obs
        })),
        total: pedido.total,
        payment: { method: pedido.formaPagamento }
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

## 🔍 Verificar Status

```bash
curl http://localhost:3000/api/status
```

**Resposta:**

```json
{
  "success": true,
  "status": {
    "balcao": {
      "config": { "type": "i8_network", "ip": "192.168.1.100", "port": 9100 },
      "available": true,
      "connected": true
    },
    "cozinha": {
      "config": { "type": "i8_network", "ip": "192.168.1.101", "port": 9100 },
      "available": false,
      "connected": false
    }
  }
}
```

---

## 📋 Destinos de Impressão

O campo `destination` pode ser:

- `"balcao"` - Imprime apenas no balcão
- `"cozinha"` - Imprime apenas na cozinha
- `"ambos"` - Imprime nas duas impressoras

**Exemplo imprimindo nas duas:**

```javascript
{
  "destination": "ambos",
  "type": "order",
  "data": { ... }
}
```

---

## 🛠️ Troubleshooting

### Agente não inicia

```bash
# Verificar se Node.js está instalado
node --version

# Reinstalar dependências
npm install
```

### Erro "CORS"

✅ **Já está configurado!** O CORS está habilitado para todos os domínios.

### Timeout ao conectar

```bash
# Verificar se impressora está ligada
ping 192.168.1.100

# Verificar se porta 9100 está aberta
telnet 192.168.1.100 9100
```

### Impressora não imprime

1. Teste com `/api/test/cozinha`
2. Verifique os logs no terminal do agente
3. Confirme IP e porta corretos
4. Verifique se há papel na impressora

---

## 📂 Arquivos do Projeto

```
agente-impressao-local/
├── package.json       - Dependências
├── server.js          - API HTTP
├── printer.js         - Lógica ESC/POS
├── formatter.js       - Formatação (32 colunas)
├── config.json        - Config salva (criado auto)
└── README.md          - Documentação completa
```

---

## 🔄 Workflow Completo

```
1. PWA no navegador
   │
   ├─► POST /api/configure (1x na abertura)
   │   └─► Configura IPs das impressoras
   │
   ├─► GET /api/status (opcional - verificar conexão)
   │
   └─► POST /api/print (ao confirmar pedido)
       └─► Imprime na impressora de rede
```

---

## 💡 Dicas

1. **Configure uma vez** via `/api/configure` e a configuração fica salva em `config.json`

2. **Use `destination: "ambos"`** para imprimir no balcão e cozinha simultaneamente

3. **Teste sempre** com `/api/test/cozinha` antes de imprimir pedidos reais

4. **Verifique os logs** no terminal onde o agente está rodando

5. **Para rodar em background:** Use PM2 (como no agente anterior)

---

## 🚀 Produção (PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start server.js --name agente-local

# Auto-start Windows
pm2 startup
pm2 save

# Ver logs
pm2 logs agente-local
```

---

**Pronto! Agente funcionando em localhost:3000** ✅
