# 📊 Análise de Suporte de Impressoras - Agente Local

## ✅ Status Atual

### **TCP/IP (Rede Ethernet) - ✅ TOTALMENTE SUPORTADO**

O agente **JÁ ESTÁ CONFIGURADO** para impressoras conectadas via **TCP/IP (Ethernet)**:

#### **Características:**
- ✅ Protocolo: TCP/IP Socket
- ✅ Porta padrão: 9100
- ✅ Comandos: ESC/POS via Buffer
- ✅ Timeout: 5s conexão, 10s leitura
- ✅ Encoding: UTF-8
- ✅ Sequência validada com delays
- ✅ Error handling completo

#### **Como Funciona:**
```javascript
// printer.js - Linha 88
async function printToNetwork(ip, port, text, options = {}) {
  const socket = new net.Socket();
  socket.connect(port, ip, () => {
    // Envia comandos ESC/POS via TCP/IP
  });
}
```

#### **Configuração (TCP/IP):**
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

#### **Impressoras Compatíveis (TCP/IP):**
- ✅ Elgin i8 (via Ethernet)
- ✅ Elgin i9 (via Ethernet)
- ✅ Epson TM-T20 (via Ethernet)
- ✅ Daruma DR700 (via Ethernet)
- ✅ Bematech MP-4200 (via Ethernet)
- ✅ Qualquer impressora ESC/POS com porta Ethernet

---

## ❌ USB - NÃO SUPORTADO (PRECISA IMPLEMENTAR)

O agente **NÃO SUPORTA** impressoras conectadas via **USB** atualmente.

### **Por Que Não Funciona?**

#### **Código Atual (printer.js - linha 187):**
```javascript
if (destConfig.type !== 'i8_network') {
  return {
    success: false,
    error: `${destination} não está configurada como impressora de rede`
  };
}
```

**Problema:** O código rejeita qualquer tipo que não seja `i8_network`.

#### **O Que Está Faltando:**

1. ❌ Módulo `serialport` não instalado
2. ❌ Função `printToUSB()` não existe
3. ❌ Detecção de porta COM não implementada
4. ❌ Tipo `usb` ou `serial` não tratado
5. ❌ Validação de porta COM não existe

---

## 🔧 Como Adicionar Suporte USB

### **1️⃣ Instalar Dependência**

```bash
npm install serialport
```

### **2️⃣ Atualizar `printer.js`**

Adicionar no início do arquivo:

```javascript
const { SerialPort } = require('serialport');
```

### **3️⃣ Criar Função `printToUSB()`**

```javascript
// Imprimir via USB/Serial (COM)
async function printToUSB(comPort, text, options = {}) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: comPort,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    });

    port.on('open', () => {
      console.log(`✅ Conectado em ${comPort}`);

      // Mesmo processo de impressão ESC/POS
      try {
        port.write(Buffer.from(CMD_INIT));

        setTimeout(() => {
          port.write(Buffer.from(CMD_ALIGN_LEFT));

          const lines = text.split('\n');
          lines.forEach(line => {
            port.write(Buffer.from(line, 'utf8'));
            port.write(Buffer.from([0x0A]));
          });

          setTimeout(() => {
            if (options.cutPaper) {
              port.write(Buffer.from(CMD_CUT));
            }

            setTimeout(() => {
              port.close();
              resolve({
                success: true,
                message: `Impresso em ${comPort}`,
                port: comPort,
                lines: lines.length
              });
            }, 200);
          }, 100);
        }, 50);

      } catch (error) {
        port.close();
        reject(error);
      }
    });

    port.on('error', (error) => {
      console.error(`❌ Erro porta ${comPort}:`, error.message);
      reject(new Error(`Erro ao abrir porta: ${error.message}`));
    });
  });
}
```

### **4️⃣ Atualizar `printToDestination()`**

```javascript
async function printToDestination(destination, payload) {
  const destConfig = destination === 'balcao' ? config.balcao : config.cozinha;

  console.log(`🎯 Destino: ${destination}`);
  console.log(`   Config:`, destConfig);

  // Suporte USB/Serial
  if (destConfig.type === 'usb' || destConfig.type === 'serial') {
    if (!destConfig.port) {
      return {
        success: false,
        error: `Porta COM não configurada para ${destination}`
      };
    }

    const text = payload.rawText || formatOrder(payload.data, payload.options);
    const result = await printToUSB(
      destConfig.port,
      text,
      payload.options || {}
    );

    result.destination = destination;
    return result;
  }

  // Suporte TCP/IP (código existente)
  if (destConfig.type === 'i8_network') {
    if (!destConfig.ip) {
      return {
        success: false,
        error: `IP da ${destination} não configurado`
      };
    }

    const port = destConfig.port || 9100;
    const text = payload.rawText || formatOrder(payload.data, payload.options);
    const result = await printToNetwork(
      destConfig.ip,
      port,
      text,
      payload.options || {}
    );

    result.destination = destination;
    result.port = port;
    return result;
  }

  // Tipo não suportado
  return {
    success: false,
    error: `Tipo de impressora não suportado: ${destConfig.type}`
  };
}
```

### **5️⃣ Configuração USB**

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

### **6️⃣ Detectar Portas COM Disponíveis**

Adicionar endpoint para listar portas:

```javascript
// No server.js
app.get('/api/ports', async (req, res) => {
  try {
    const { SerialPort } = require('serialport');
    const ports = await SerialPort.list();

    res.json({
      success: true,
      ports: ports.map(p => ({
        path: p.path,
        manufacturer: p.manufacturer,
        serialNumber: p.serialNumber,
        productId: p.productId
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 📋 Configurações Possíveis Após Implementação

### **Opção 1: Somente TCP/IP (Atual)**
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

### **Opção 2: TCP/IP + USB (Após Implementação)**
```json
{
  "balcao": {
    "type": "usb",
    "port": "COM3",
    "baudRate": 9600
  },
  "cozinha": {
    "type": "i8_network",
    "ip": "192.168.1.101",
    "port": 9100
  }
}
```

### **Opção 3: Ambas USB (Após Implementação)**
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

---

## 🎯 Resumo

| Recurso | Status Atual | Ação Necessária |
|---------|--------------|-----------------|
| **TCP/IP (Ethernet)** | ✅ **FUNCIONA** | Nenhuma - já está OK |
| **USB/Serial (COM)** | ❌ Não funciona | Implementar suporte |

### **TCP/IP: ✅ Pronto para Uso**
- Nenhuma alteração necessária
- Funciona com Elgin i8, i9, Epson, Bematech, etc
- Porta padrão: 9100
- Configuração via IP

### **USB: ❌ Precisa Implementar**
- Instalar: `npm install serialport`
- Adicionar função `printToUSB()`
- Atualizar `printToDestination()`
- Suporte a tipos: `usb` e `serial`
- Configuração via porta COM (ex: COM3, COM4)

---

## 🚀 Recomendação

**Para seu caso de uso (Elgin i8 via Ethernet):**

✅ **Você NÃO precisa do suporte USB**

O agente **já está 100% funcional** para impressoras via TCP/IP (Ethernet).

**Implemente USB apenas se:**
- Precisar conectar impressora via cabo USB
- A impressora não tiver porta Ethernet
- Não puder usar rede para impressão

---

## 📞 Dúvidas Frequentes

### **1. Minha Elgin i8 tem USB, preciso implementar?**
❌ **Não!** Se ela está conectada via **Ethernet** (cabo de rede), use o tipo `i8_network` que **já funciona**.

### **2. Como sei se minha impressora é TCP/IP ou USB?**
- **TCP/IP:** Cabo de rede (RJ45) conectado
- **USB:** Cabo USB conectado no computador

### **3. Posso usar as duas ao mesmo tempo?**
✅ Sim! Após implementar USB, você pode ter uma impressora em cada tipo.

### **4. Preciso instalar drivers USB?**
✅ Sim, para USB você precisa:
- Driver da impressora instalado no Windows
- Saber qual porta COM está usando (ver no Gerenciador de Dispositivos)

---

**Conclusão: O agente está 100% funcional para TCP/IP. Implementar USB apenas se necessário.** ✅
