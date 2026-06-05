# 🔌 Guia USB - Suporte Completo

## ✅ Suporte USB Implementado!

O agente local agora suporta **impressoras USB/Serial** além de TCP/IP!

---

## 📋 Tipos de Conexão Suportados

| Tipo | Tecnologia | Configuração | Status |
|------|------------|--------------|--------|
| **TCP/IP** | Rede Ethernet | IP + Porta | ✅ Funciona |
| **USB/Serial** | Porta COM | Porta COM | ✅ **NOVO!** |

---

## 🔧 Configuração USB

### **1️⃣ Conectar a Impressora**

1. **Conecte o cabo USB** da impressora no computador
2. **Instale o driver** da impressora (se necessário)
3. **Verifique a porta COM** no Gerenciador de Dispositivos:
   - Aperte `Win + X` → **Gerenciador de Dispositivos**
   - Expanda **Portas (COM e LPT)**
   - Anote a porta COM (ex: `COM3`, `COM4`, `COM5`)

---

### **2️⃣ Descobrir Portas Disponíveis**

O agente tem um endpoint para listar portas COM automaticamente:

**Via navegador:**
```
http://localhost:3000/api/ports
```

**Via JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/ports');
const data = await response.json();

console.log('Portas disponíveis:', data.ports);
// [
//   { path: 'COM3', manufacturer: 'Elgin', ... },
//   { path: 'COM4', manufacturer: 'FTDI', ... }
// ]
```

**Via PowerShell:**
```powershell
curl http://localhost:3000/api/ports | ConvertFrom-Json | ConvertTo-Json
```

---

### **3️⃣ Configurar Impressora USB**

#### **Configuração via JavaScript:**

```javascript
await fetch('http://localhost:3000/api/configure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    balcao: {
      type: 'usb',           // 'usb' ou 'serial'
      port: 'COM3',          // Porta COM
      baudRate: 9600         // Opcional (padrão: 9600)
    },
    cozinha: {
      type: 'i8_network',    // TCP/IP continua funcionando
      ip: '192.168.1.101',
      port: 9100
    }
  })
});
```

#### **Configuração via `config.json`:**

Edite manualmente o arquivo `config.json`:

```json
{
  "balcao": {
    "type": "usb",
    "port": "COM3",
    "baudRate": 9600
  },
  "cozinha": {
    "type": "usb",
    "port": "COM4",
    "baudRate": 9600
  }
}
```

**Depois de editar, reinicie o agente:**
```bash
pm2 restart agente-impressao
```

---

## 📊 Exemplos de Configuração

### **Exemplo 1: Ambas USB**

```json
{
  "balcao": {
    "type": "usb",
    "port": "COM3"
  },
  "cozinha": {
    "type": "usb",
    "port": "COM4"
  }
}
```

### **Exemplo 2: Balcão USB + Cozinha TCP/IP**

```json
{
  "balcao": {
    "type": "usb",
    "port": "COM3"
  },
  "cozinha": {
    "type": "i8_network",
    "ip": "192.168.1.101",
    "port": 9100
  }
}
```

### **Exemplo 3: Ambas TCP/IP**

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

---

## 🧪 Testar Impressão USB

### **1. Via Navegador:**

Acesse: `http://localhost:3000/api/test/balcao`

### **2. Via JavaScript:**

```javascript
await fetch('http://localhost:3000/api/test/balcao', {
  method: 'POST'
});
```

### **3. Via PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/test/balcao -Method POST
```

---

## 🖨️ Imprimir Pedido via USB

O payload é **IDÊNTICO** ao TCP/IP. O agente detecta automaticamente o tipo:

```javascript
await fetch('http://localhost:3000/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: 'balcao',  // balcao, cozinha ou ambos
    type: 'order',
    data: {
      pizzariaName: 'Pizzaria Jack Jango',
      orderNumber: '456',
      items: [
        {
          quantity: 1,
          name: 'Pizza Calabresa G',
          total: 45.00
        }
      ],
      total: 45.00,
      payment: {
        method: 'Dinheiro',
        paid: 50.00,
        change: 5.00
      }
    },
    options: {
      cutPaper: true,
      feedLines: 3
    }
  })
});
```

**Funciona IGUAL**, independente se a impressora está via **USB** ou **TCP/IP**!

---

## ⚙️ Parâmetros USB

| Parâmetro | Obrigatório | Padrão | Descrição |
|-----------|-------------|--------|-----------|
| `type` | ✅ Sim | - | `'usb'` ou `'serial'` |
| `port` | ✅ Sim | - | `'COM3'`, `'COM4'`, etc |
| `baudRate` | ❌ Não | `9600` | Taxa de transmissão |

**Parâmetros Fixos (não alterar):**
- `dataBits`: 8
- `parity`: `'none'`
- `stopBits`: 1

---

## 🔍 Verificar Status

```javascript
const response = await fetch('http://localhost:3000/api/status');
const data = await response.json();

console.log(data);
// {
//   success: true,
//   status: {
//     balcao: {
//       config: { type: 'usb', port: 'COM3', baudRate: 9600 },
//       available: true,
//       connected: true
//     },
//     cozinha: {
//       config: { type: 'i8_network', ip: '192.168.1.101', port: 9100 },
//       available: true,
//       connected: true
//     }
//   }
// }
```

---

## 🐛 Troubleshooting USB

### **❌ Erro: "Porta COM não configurada"**

**Solução:** Configure a porta no `config.json` ou via `/api/configure`.

---

### **❌ Erro: "Erro ao abrir porta: Access denied"**

**Causas possíveis:**
1. Outra aplicação está usando a porta COM
2. Driver não instalado
3. Cabo USB desconectado

**Solução:**
1. Feche outros programas que usam a impressora
2. Reinstale o driver da impressora
3. Reconecte o cabo USB
4. Reinicie o computador

---

### **❌ Erro: "Timeout ao abrir porta"**

**Causas:**
- Porta COM errada
- Impressora desligada
- Cabo USB com defeito

**Solução:**
1. Verifique a porta COM no Gerenciador de Dispositivos
2. Ligue a impressora
3. Teste outro cabo USB

---

### **❌ Nenhuma porta COM aparece**

**Causas:**
- Driver não instalado
- Impressora não conectada
- USB não reconhecido

**Solução:**
1. Instale o driver oficial da Elgin
2. Conecte a impressora via USB
3. Verifique no Gerenciador de Dispositivos

---

## 📞 Como Identificar a Porta COM

### **Método 1: Gerenciador de Dispositivos**

1. `Win + X` → **Gerenciador de Dispositivos**
2. Expanda **Portas (COM e LPT)**
3. Procure por:
   - `USB Serial Port (COM3)`
   - `Elgin i8 (COM4)`
   - `Prolific USB-to-Serial Comm Port (COM5)`

### **Método 2: Via API**

```bash
curl http://localhost:3000/api/ports
```

Retorna:
```json
{
  "success": true,
  "ports": [
    {
      "path": "COM3",
      "manufacturer": "Elgin",
      "serialNumber": "1234567",
      "productId": "0x5678",
      "vendorId": "0x1234"
    }
  ],
  "count": 1
}
```

### **Método 3: PowerShell**

```powershell
Get-CimInstance -ClassName Win32_SerialPort | Select-Object Name, DeviceID
```

---

## 🎯 Resumo Rápido

| Ação | Comando |
|------|---------|
| **Listar portas** | `GET /api/ports` |
| **Configurar USB** | `POST /api/configure` com `type: 'usb'` |
| **Testar** | `POST /api/test/balcao` |
| **Imprimir** | `POST /api/print` (mesmo payload) |
| **Ver config** | `GET /api/config` |
| **Status** | `GET /api/status` |

---

## 🚀 Tipos Suportados

O agente detecta automaticamente o tipo de impressora:

| Valor `type` | Conexão | Requer |
|--------------|---------|--------|
| `i8_network` | TCP/IP | `ip` + `port` |
| `usb` | USB/Serial | `port` (COM) |
| `serial` | USB/Serial | `port` (COM) |

**`usb` e `serial` são equivalentes** (mesmo comportamento).

---

## ✅ Compatibilidade

**Impressoras USB Testadas:**
- ✅ Elgin i8 (USB)
- ✅ Elgin i9 (USB)
- ✅ Epson TM-T20 (USB)
- ✅ Bematech MP-4200 (USB)
- ✅ Daruma DR700 (USB)

**Protocolo:**
- ESC/POS padrão
- Comandos idênticos ao TCP/IP
- Formato 58mm (32 colunas)

---

## 📄 Endpoints da API

### **GET /api/ports**
Lista portas seriais disponíveis.

**Response:**
```json
{
  "success": true,
  "ports": [
    {
      "path": "COM3",
      "manufacturer": "Elgin",
      "serialNumber": "1234567",
      "productId": "0x5678",
      "vendorId": "0x1234"
    }
  ],
  "count": 1
}
```

### **POST /api/configure**
Configura impressoras (TCP/IP ou USB).

**Body:**
```json
{
  "balcao": {
    "type": "usb",
    "port": "COM3",
    "baudRate": 9600
  }
}
```

### **POST /api/print**
Imprime pedido (detecta tipo automaticamente).

**Body:**
```json
{
  "destination": "balcao",
  "type": "order",
  "data": { ... },
  "options": { "cutPaper": true }
}
```

---

## 🎉 Conclusão

✅ **USB totalmente funcional!**

Agora você pode usar:
- **TCP/IP** (Ethernet) ✅
- **USB** (Porta COM) ✅
- **Ou ambos juntos!** ✅

**Payload idêntico, funciona em qualquer tipo de impressora!** 🚀
