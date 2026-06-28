# ✅ Validação do Contrato PWA ↔ Agente Local

Documento de conformidade do agente com o **contrato oficial** que o PWA de PDV usa
(base `http://localhost:3000`, configurável por `VITE_PRINT_AGENT_URL`).

Versão do agente validada: **1.1.0**

---

## Resumo

Todos os endpoints e shapes do contrato estão implementados e testados. As divergências
encontradas na validação inicial foram corrigidas:

| # | Item | Antes | Depois |
|---|------|-------|--------|
| 1 | `/health` shape | `{status:"ok", version, timestamp}` | ✅ `{status:"online", agent_version, uptime_seconds}` |
| 2 | `openDrawer` | abria em qualquer slot | ✅ abre **só no balcão** |
| 3 | `item.price` | ignorado | ✅ preço unitário exibido quando qtd > 1 |
| 4 | `passwordFontSize`/`passwordBold` | sem efeito | ✅ senha sai ampliada (`GS !`) e/ou negrito (`ESC E`) |
| 5 | `m8_internal` | "tipo não suportado" | ✅ tratado como rede (i8_network) |
| 6 | CORS | aberto a `*` | ✅ restrito às origens do PWA |

---

## Endpoints (todos conformes)

| Método | Rota | Resposta |
|--------|------|----------|
| GET | `/health` | `{status:"online", agent_version, uptime_seconds}` |
| POST | `/api/configure` | `{success:true, message, config}` |
| GET | `/api/status` | `{success:true, status:{balcao:{available}, cozinha:{available}}}` |
| GET | `/api/config` | `{success:true, config}` |
| POST | `/api/test/balcao` | `{success:true, ...}` |
| POST | `/api/test/cozinha` | `{success:true, ...}` |
| POST | `/api/print` | simples: `{success, message}` · ambos: `{success, results:[balcão, cozinha]}` · erro: `{success:false, error}` |

---

## CORS

Origens autorizadas (configuráveis por variável de ambiente `ALLOWED_ORIGINS`, separadas por vírgula):

- `https://pizza-bahia-connect.vercel.app`
- `http://localhost:5173`

Preflight `OPTIONS` responde `Access-Control-Allow-Origin` com a origem exata,
`Access-Control-Allow-Methods: GET,POST,OPTIONS` e `Access-Control-Allow-Headers: Content-Type`.
Origens não listadas recebem 200 **sem** o header de permissão (o navegador bloqueia; o agente não gera 500).

---

## Comportamentos do contrato

- **Fonte de verdade da config**: o agente persiste a config física em `config.json`. O PWA
  envia apenas `destination` + `data`; o agente resolve IP/porta por slot.
- **`destination:"ambos"`**: imprime nos dois slots e devolve `results[0]=balcão`, `results[1]=cozinha`.
- **`openDrawer`**: gaveta abre somente no slot `balcao` (mesmo em `ambos`).
- **`cutPaper`**: corta o papel ao final.
- **`passwordFontSize:"large"`**: senha em corpo dobrado. **`passwordBold:true`**: senha em negrito.
- **Impressora indisponível**: timeout vira `{success:false, error}` sem derrubar o processo.

---

## Testes com curl

### /health

```bash
curl -s http://localhost:3000/health
# {"status":"online","agent_version":"1.1.0","uptime_seconds":23}
```

### CORS preflight (origem do PWA)

```bash
curl -s -i -X OPTIONS http://localhost:3000/api/print \
  -H "Origin: https://pizza-bahia-connect.vercel.app" \
  -H "Access-Control-Request-Method: POST"
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: https://pizza-bahia-connect.vercel.app
# Access-Control-Allow-Methods: GET,POST,OPTIONS
# Access-Control-Allow-Headers: Content-Type
```

### /api/configure (define impressoras por slot)

```bash
curl -s -X POST http://localhost:3000/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "balcao":  { "type": "i8_network", "ip": "192.168.0.50", "port": 9100 },
    "cozinha": { "type": "i8_network", "ip": "192.168.0.51", "port": 9100 }
  }'
# {"success":true,"message":"Impressoras configuradas","config":{...}}
```

### /api/print (pedido, destination=ambos)

```bash
curl -s -X POST http://localhost:3000/api/print \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "destination": "ambos",
    "data": {
      "pizzariaName": "JackJango Express",
      "senha": "042",
      "orderNumber": "041224-017",
      "items": [
        { "quantity": 1, "name": "Pizza Calabresa G", "price": 59.9, "total": 59.9, "observations": "sem cebola" }
      ],
      "payment": { "method": "PIX", "paid": 59.9, "change": 0 },
      "total": 59.9,
      "observations": ""
    },
    "options": {
      "cutPaper": true, "openDrawer": true, "feedLines": 3,
      "passwordFontSize": "large", "passwordBold": true
    }
  }'
# Sucesso: {"success":true,"results":[{"success":true,...},{"success":true,...}]}
# Sem impressora: {"success":false,"results":[{"success":false,"error":"..."},{...}]}
```

---

## Instalação (PM2)

```bash
cd agente-impressao-local
npm install
pm2 start ecosystem.config.js
pm2 save
```

Para auto-iniciar com o Windows, ver [INSTALL.md](INSTALL.md).

Comandos úteis:

```bash
pm2 status                       # ver estado
pm2 logs agente-impressao        # ver logs
pm2 restart agente-impressao     # reiniciar após mudança de código
```

---

## ⚠️ Pendências para produção

1. **Config atual em disco está vazia de IP** (`config.json` com `m8_internal` sem `ip`).
   Configure as impressoras reais via `/api/configure` (ou pelo PWA) antes de imprimir —
   caso contrário `/api/print` retorna `{success:false,"error":"IP da ... não configurado"}`.
2. **HTTPS**: o agente roda em HTTP. Se o PWA em HTTPS exigir, adicionar um listener HTTPS
   com cert self-signed (aceito uma vez no navegador). Não implementado nesta versão.
3. **Teste físico**: a validação de impressão real depende de impressora conectada.
   Os testes acima cobrem o contrato (shapes, CORS, roteamento de slots, tratamento de erro).
