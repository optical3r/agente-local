# 🔌 Integração Lovable - Guia Completo

## ❌ Erro: "Nenhum sistema de impressão"

Este erro aparece quando o Lovable não consegue detectar o agente local.

---

## ✅ Solução: Atualizar o printerAdapter no Lovable

### 1️⃣ **Localizar o arquivo `printerAdapter`**

No seu projeto Lovable, procure por:
- `printerAdapter.js` ou `printerAdapter.ts`
- Pode estar em: `src/lib/`, `src/utils/`, `src/adapters/`

### 2️⃣ **Adicionar detecção do agente local**

O arquivo deve ter uma função que verifica se há impressora disponível. Atualize assim:

```typescript
// printerAdapter.ts

const AGENTE_LOCAL_URL = 'http://localhost:3000';

/**
 * Verifica se há um sistema de impressão disponível
 */
export async function verificarSistemaImpressao(): Promise<boolean> {
  // 1. Verificar se está no app Android M8
  if (typeof (window as any).Android !== 'undefined') {
    console.log('[printerAdapter] ✅ App Android M8 detectado');
    return true;
  }

  // 2. Verificar se o agente local está rodando
  try {
    const response = await fetch(`${AGENTE_LOCAL_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // Timeout 2s
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok') {
        console.log('[printerAdapter] ✅ Agente local detectado');
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
 * Detectar qual sistema de impressão usar
 */
export function detectarSistemaImpressao(): 'android' | 'agente-local' | null {
  // Android M8
  if (typeof (window as any).Android !== 'undefined') {
    return 'android';
  }

  // Agente local (assumir que está disponível se não for Android)
  // A verificação real será feita na hora de imprimir
  if (typeof window !== 'undefined') {
    return 'agente-local';
  }

  return null;
}
```

### 3️⃣ **Atualizar a função de impressão**

```typescript
// printerAdapter.ts

export async function imprimir(
  pedido: any,
  destino: 'balcao' | 'cozinha' | 'ambos' = 'cozinha'
) {
  const sistema = detectarSistemaImpressao();

  if (sistema === 'android') {
    // Impressão no Android M8
    return imprimirAndroid(pedido, destino);
  }

  if (sistema === 'agente-local') {
    // Impressão via agente local
    return imprimirAgenteLocal(pedido, destino);
  }

  throw new Error('Nenhum sistema de impressão disponível');
}

/**
 * Imprimir via Android M8
 */
function imprimirAndroid(pedido: any, destino: string) {
  console.log('[printerAdapter] 🖨️ Imprimindo via Android M8');

  if (typeof (window as any).Android === 'undefined') {
    throw new Error('Android interface não disponível');
  }

  // Seu código Android aqui
  (window as any).Android.print(JSON.stringify({
    destination: destino,
    order: pedido
  }));

  return { success: true, method: 'android' };
}

/**
 * Imprimir via agente local
 */
async function imprimirAgenteLocal(pedido: any, destino: string) {
  console.log('[printerAdapter] 🖨️ Imprimindo via agente local');

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
        payment: pedido.payment || { method: 'Dinheiro' }
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
```

---

## 🎯 Solução Rápida (Copiar e Colar)

Se você não encontrar o arquivo, crie um novo `printerAdapter.ts`:

```typescript
// src/lib/printerAdapter.ts

const AGENTE_LOCAL_URL = 'http://localhost:3000';

export async function verificarSistemaImpressao(): Promise<boolean> {
  if (typeof (window as any).Android !== 'undefined') return true;

  try {
    const response = await fetch(`${AGENTE_LOCAL_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export function detectarSistemaImpressao(): 'android' | 'agente-local' | null {
  if (typeof (window as any).Android !== 'undefined') return 'android';
  if (typeof window !== 'undefined') return 'agente-local';
  return null;
}

export async function imprimir(pedido: any, destino: 'balcao' | 'cozinha' | 'ambos' = 'cozinha') {
  const sistema = detectarSistemaImpressao();

  if (sistema === 'android') {
    (window as any).Android.print(JSON.stringify({ destination: destino, order: pedido }));
    return { success: true, method: 'android' };
  }

  if (sistema === 'agente-local') {
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
          payment: pedido.payment || { method: 'Dinheiro' }
        },
        options: { cutPaper: true, feedLines: 3 }
      })
    });

    const result = await response.json();
    return { success: result.success, method: 'agente-local', ...result };
  }

  throw new Error('Nenhum sistema de impressão disponível');
}
```

---

## 🧪 Testar no Console do Navegador

Abra o **DevTools** (F12) no Lovable e teste:

```javascript
// Testar se o agente está acessível
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Deve retornar: { status: "ok", timestamp: "...", version: "1.0.0" }
```

---

## ⚠️ Possível Problema: CORS

Se aparecer erro de CORS no console:

```
Access to fetch at 'http://localhost:3000/health' from origin 'https://seu-app.lovable.app' 
has been blocked by CORS policy
```

**Solução:** O agente já tem CORS habilitado, mas verifique se está rodando:

```bash
pm2 logs agente-impressao
```

---

## 🔧 Checklist de Troubleshooting

- [ ] Agente rodando: `pm2 status` (deve estar "online")
- [ ] Health check OK: `curl http://localhost:3000/health`
- [ ] Lovable no mesmo PC onde o agente roda
- [ ] Código do Lovable atualizado com detecção do agente local
- [ ] Console do navegador sem erros de CORS
- [ ] Teste manual no DevTools funciona

---

## 📞 Se Ainda Não Funcionar

1. **Verifique os logs do agente:**
   ```bash
   pm2 logs agente-impressao --lines 50
   ```

2. **Verifique o console do navegador (F12)**
   - Procure por erros relacionados a `printerAdapter`
   - Verifique se há erros de rede (Network tab)

3. **Teste direto no navegador:**
   ```
   http://localhost:3000/health
   ```

---

## ✅ Resultado Esperado

Após aplicar as mudanças, o log deve mostrar:

```
[printerAdapter] ✅ Agente local detectado
```

Em vez de:

```
[printerAdapter] ⚠️ Nenhum sistema de impressão...
```

---

**Próximo passo: Atualize o código do Lovable com a detecção do agente local!** 🚀
