# 🧪 Teste de Comunicação PWA Lovable ↔ Agente Local

## 📋 Checklist de Verificação

Use este guia para confirmar que o PWA Lovable está conversando corretamente com o agente local.

---

## ✅ PRÉ-REQUISITOS

Antes de testar a comunicação:

- [ ] Agente local rodando (`pm2 status` → online)
- [ ] PWA Lovable aberto no **mesmo computador** onde o agente roda
- [ ] Navegador: Chrome, Edge ou Firefox
- [ ] DevTools aberto (F12)

---

## 🔍 TESTE 1: Verificar se o Agente Está Acessível

### **1.1 Via Navegador (método mais simples)**

Abra no navegador:
```
http://localhost:3000/health
```

**✅ Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-05T14:30:00.000Z",
  "version": "1.1.0"
}
```

❌ **Se der erro:** O agente não está rodando ou tem problema de firewall.

---

### **1.2 Via Console do Navegador (F12)**

Abra o **DevTools** (F12) → **Console** e execute:

```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Agente acessível:', data);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
```

**✅ Resultado esperado:**
```
✅ Agente acessível: {status: "ok", timestamp: "...", version: "1.1.0"}
```

---

## 🔍 TESTE 2: Verificar Detecção do Sistema

### **2.1 Função de Detecção (copie no Console)**

```javascript
// Verificar qual sistema de impressão foi detectado
async function verificarSistemaImpressao() {
  // 1. Verificar Android M8
  if (typeof window.Android !== 'undefined') {
    console.log('✅ Sistema detectado: Android M8');
    return 'android';
  }

  // 2. Verificar agente local
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('http://localhost:3000/health', {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log('✅ Sistema detectado: Agente Local');
        console.log('   Versão:', data.version);
        console.log('   Timestamp:', data.timestamp);
        return 'agente-local';
      }
    }
  } catch (error) {
    console.warn('⚠️ Agente local não encontrado:', error.message);
  }

  console.error('❌ Nenhum sistema de impressão disponível');
  return null;
}

// Executar
verificarSistemaImpressao();
```

**✅ Resultado esperado:**
```
✅ Sistema detectado: Agente Local
   Versão: 1.1.0
   Timestamp: 2026-06-05T14:30:00.000Z
```

---

## 🔍 TESTE 3: Listar Portas (USB/Serial)

### **3.1 Via Console**

```javascript
fetch('http://localhost:3000/api/ports')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Portas seriais disponíveis:', data);
    console.log('   Total:', data.count);
    if (data.count > 0) {
      data.ports.forEach(p => {
        console.log(`   - ${p.path} (${p.manufacturer || 'Desconhecido'})`);
      });
    } else {
      console.log('   ℹ️ Nenhuma porta USB encontrada');
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
```

**✅ Resultado esperado:**
```
✅ Portas seriais disponíveis: {success: true, ports: [...], count: 1}
   Total: 1
   - COM3 (Elgin)
```

ou

```
✅ Portas seriais disponíveis: {success: true, ports: [], count: 0}
   Total: 0
   ℹ️ Nenhuma porta USB encontrada
```

---

## 🔍 TESTE 4: Ver Configuração Atual

### **4.1 Via Console**

```javascript
fetch('http://localhost:3000/api/config')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Configuração atual:');
    console.log(JSON.stringify(data.config, null, 2));
    
    // Verificar balcão
    if (data.config.balcao) {
      console.log(`\n📍 Balcão:`);
      console.log(`   Tipo: ${data.config.balcao.type}`);
      if (data.config.balcao.type === 'i8_network') {
        console.log(`   IP: ${data.config.balcao.ip}`);
        console.log(`   Porta: ${data.config.balcao.port || 9100}`);
      } else if (data.config.balcao.type === 'usb') {
        console.log(`   Porta COM: ${data.config.balcao.port}`);
      }
    }
    
    // Verificar cozinha
    if (data.config.cozinha) {
      console.log(`\n📍 Cozinha:`);
      console.log(`   Tipo: ${data.config.cozinha.type}`);
      if (data.config.cozinha.type === 'i8_network') {
        console.log(`   IP: ${data.config.cozinha.ip}`);
        console.log(`   Porta: ${data.config.cozinha.port || 9100}`);
      } else if (data.config.cozinha.type === 'usb') {
        console.log(`   Porta COM: ${data.config.cozinha.port}`);
      }
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
```

**✅ Resultado esperado:**
```
✅ Configuração atual:
{
  "balcao": { "type": "m8_internal" },
  "cozinha": { "type": "i8_network", "ip": "192.168.86.92" }
}

📍 Balcão:
   Tipo: m8_internal

📍 Cozinha:
   Tipo: i8_network
   IP: 192.168.86.92
   Porta: 9100
```

---

## 🔍 TESTE 5: Configurar Impressora (Exemplo USB)

### **5.1 Configurar Balcão como USB**

```javascript
fetch('http://localhost:3000/api/configure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    balcao: {
      type: 'usb',
      port: 'COM3',
      baudRate: 9600
    },
    cozinha: {
      type: 'i8_network',
      ip: '192.168.1.101',
      port: 9100
    }
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Configuração atualizada:', data);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
```

**✅ Resultado esperado:**
```
✅ Configuração atualizada: {
  success: true,
  message: "Impressoras configuradas",
  config: { ... }
}
```

---

## 🔍 TESTE 6: Imprimir Pedido de Teste

### **6.1 Pedido Simples (Console)**

```javascript
const pedidoTeste = {
  destination: 'cozinha',  // 'balcao', 'cozinha' ou 'ambos'
  type: 'order',
  data: {
    pizzariaName: 'Pizzaria Jack Jango',
    orderNumber: '999',
    items: [
      {
        quantity: 1,
        name: 'Pizza Calabresa G',
        total: 45.00,
        observations: 'Teste do PWA'
      }
    ],
    total: 45.00,
    payment: {
      method: 'Teste',
      paid: 45.00,
      change: 0.00
    },
    observations: 'TESTE DE COMUNICAÇÃO PWA → AGENTE LOCAL'
  },
  options: {
    cutPaper: true,
    feedLines: 3
  }
};

fetch('http://localhost:3000/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pedidoTeste)
})
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      console.log('✅ IMPRESSÃO ENVIADA COM SUCESSO!');
      console.log('   Destino:', data.destination);
      if (data.ip) {
        console.log('   IP:', data.ip);
        console.log('   Porta:', data.port);
      }
      if (data.port && !data.ip) {
        console.log('   Porta COM:', data.port);
      }
      console.log('   Linhas:', data.lines);
      console.log('\n🖨️ Verifique se a impressora imprimiu!');
    } else {
      console.error('❌ Erro na impressão:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Erro ao enviar:', error);
  });
```

**✅ Resultado esperado:**
```
✅ IMPRESSÃO ENVIADA COM SUCESSO!
   Destino: cozinha
   IP: 192.168.86.92
   Porta: 9100
   Linhas: 28

🖨️ Verifique se a impressora imprimiu!
```

---

## 🔍 TESTE 7: Verificar Status das Impressoras

### **7.1 Via Console**

```javascript
fetch('http://localhost:3000/api/status')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Status das impressoras:');
    
    // Balcão
    console.log('\n📍 Balcão:');
    console.log(`   Configurada: ${data.status.balcao.config ? 'Sim' : 'Não'}`);
    console.log(`   Disponível: ${data.status.balcao.available ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Conectada: ${data.status.balcao.connected ? '✅ Sim' : '❌ Não'}`);
    if (data.status.balcao.config) {
      console.log(`   Tipo: ${data.status.balcao.config.type}`);
    }
    
    // Cozinha
    console.log('\n📍 Cozinha:');
    console.log(`   Configurada: ${data.status.cozinha.config ? 'Sim' : 'Não'}`);
    console.log(`   Disponível: ${data.status.cozinha.available ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Conectada: ${data.status.cozinha.connected ? '✅ Sim' : '❌ Não'}`);
    if (data.status.cozinha.config) {
      console.log(`   Tipo: ${data.status.cozinha.config.type}`);
    }
  })
  .catch(error => {
    console.error('❌ Erro:', error);
  });
```

**✅ Resultado esperado:**
```
✅ Status das impressoras:

📍 Balcão:
   Configurada: Sim
   Disponível: ❌ Não
   Conectada: ❌ Não
   Tipo: m8_internal

📍 Cozinha:
   Configurada: Sim
   Disponível: ✅ Sim
   Conectada: ✅ Sim
   Tipo: i8_network
```

---

## 🐛 Troubleshooting

### **Erro: "Failed to fetch"**

**Causa:** Agente não está rodando ou CORS bloqueado.

**Solução:**
1. Verificar PM2: `pm2 status`
2. Verificar logs: `pm2 logs agente-impressao --lines 20`
3. Reiniciar: `pm2 restart agente-impressao`

---

### **Erro: "Network Error" ou "ERR_CONNECTION_REFUSED"**

**Causa:** Agente não está acessível.

**Solução:**
1. Verificar se está rodando: `pm2 status`
2. Testar health: `curl http://localhost:3000/health`
3. Verificar porta 3000 livre: `netstat -ano | findstr :3000`

---

### **Erro: "CORS policy"**

**Causa:** CORS mal configurado (improvável, já está habilitado).

**Solução:**
1. Verificar `server.js` tem `app.use(cors())`
2. Reiniciar agente: `pm2 restart agente-impressao`

---

### **Erro: "Timeout" no fetch**

**Causa:** Agente lento ou travado.

**Solução:**
1. Aumentar timeout do fetch
2. Verificar logs: `pm2 logs agente-impressao`
3. Reiniciar: `pm2 restart agente-impressao`

---

## 📝 Código Lovable - printerAdapter.ts

Se o PWA ainda não detecta o agente, adicione este código no Lovable:

```typescript
// src/lib/printerAdapter.ts

const AGENTE_LOCAL_URL = 'http://localhost:3000';

/**
 * Verifica se há um sistema de impressão disponível
 */
export async function verificarSistemaImpressao(): Promise<boolean> {
  // 1. Verificar Android M8
  if (typeof (window as any).Android !== 'undefined') {
    console.log('[printerAdapter] ✅ Android M8 detectado');
    return true;
  }

  // 2. Verificar agente local
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${AGENTE_LOCAL_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log('[printerAdapter] ✅ Agente local detectado');
        console.log('[printerAdapter] Versão:', data.version);
        return true;
      }
    }
  } catch (error) {
    console.warn('[printerAdapter] ⚠️ Agente local não encontrado:', error);
  }

  // 3. Nenhum sistema encontrado
  console.warn('[printerAdapter] ⚠️ Nenhum sistema de impressão disponível');
  return false;
}

/**
 * Detectar qual sistema usar
 */
export function detectarSistemaImpressao(): 'android' | 'agente-local' | null {
  if (typeof (window as any).Android !== 'undefined') {
    return 'android';
  }
  
  if (typeof window !== 'undefined') {
    return 'agente-local';
  }
  
  return null;
}

/**
 * Imprimir pedido
 */
export async function imprimir(pedido: any, destino: 'balcao' | 'cozinha' | 'ambos' = 'cozinha') {
  const sistema = detectarSistemaImpressao();

  if (sistema === 'android') {
    // Impressão Android M8
    (window as any).Android.print(JSON.stringify({
      destination: destino,
      order: pedido
    }));
    return { success: true, method: 'android' };
  }

  if (sistema === 'agente-local') {
    // Impressão via agente local
    const response = await fetch(`${AGENTE_LOCAL_URL}/api/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: destino,
        type: 'order',
        data: {
          pizzariaName: pedido.pizzariaName || 'Pizzaria',
          orderNumber: pedido.orderNumber || pedido.id,
          items: pedido.items || [],
          total: pedido.total || 0,
          payment: pedido.payment || { method: 'Dinheiro' },
          observations: pedido.observations || ''
        },
        options: {
          cutPaper: true,
          feedLines: 3
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao imprimir: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: result.success, method: 'agente-local', ...result };
  }

  throw new Error('Nenhum sistema de impressão disponível');
}
```

---

## ✅ Checklist Final

- [ ] **Teste 1:** Health check funcionando
- [ ] **Teste 2:** Sistema detectado (agente-local)
- [ ] **Teste 3:** Portas listadas (se USB)
- [ ] **Teste 4:** Configuração visível
- [ ] **Teste 5:** Configuração alterada com sucesso
- [ ] **Teste 6:** Pedido impresso corretamente
- [ ] **Teste 7:** Status das impressoras correto
- [ ] **Código Lovable:** printerAdapter.ts atualizado

---

## 🎯 Resultado Esperado

Se todos os testes passarem:

```
✅ Agente local acessível
✅ Sistema detectado: Agente Local
✅ Configuração visível
✅ Impressão funcionando
✅ PWA ↔ Agente conversando corretamente!
```

---

**Pronto! Seu PWA Lovable está conversando corretamente com o agente local!** 🎉

---

## 📞 Próximos Passos

1. ✅ Configurar impressoras reais (TCP/IP ou USB)
2. ✅ Testar impressão de pedidos reais
3. ✅ Integrar botão de impressão no PWA
4. ✅ Deploy em produção

---

**Se algum teste falhar, copie o erro do console e documente para análise.** 🔍
