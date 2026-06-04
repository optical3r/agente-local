/**
 * EXEMPLO DE TESTE - AGENTE LOCAL DE IMPRESSÃO
 *
 * Execute: node test-exemplo.js
 */

const BASE_URL = 'http://localhost:3000';

// Helper para fazer requests
async function request(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + endpoint, options);
  return await response.json();
}

// 1. Testar health
async function testarHealth() {
  console.log('\n🧪 Testando health check...');
  const result = await request('/health');
  console.log('✅ Resultado:', result);
}

// 2. Configurar impressoras
async function configurarImpressoras() {
  console.log('\n📋 Configurando impressoras...');

  const config = {
    balcao: {
      type: 'i8_network',
      ip: '192.168.1.100',
      port: 9100
    },
    cozinha: {
      type: 'i8_network',
      ip: '192.168.1.101',
      port: 9100
    }
  };

  const result = await request('/api/configure', 'POST', config);
  console.log('✅ Resultado:', result);
}

// 3. Obter configuração
async function obterConfig() {
  console.log('\n📋 Obtendo configuração...');
  const result = await request('/api/config');
  console.log('✅ Configuração atual:', result);
}

// 4. Verificar status
async function verificarStatus() {
  console.log('\n📊 Verificando status...');
  const result = await request('/api/status');
  console.log('✅ Status:', JSON.stringify(result, null, 2));
}

// 5. Testar impressora da cozinha
async function testarCozinha() {
  console.log('\n🖨️ Testando impressora da cozinha...');
  const result = await request('/api/test/cozinha', 'POST');
  console.log('✅ Resultado:', result);
}

// 6. Imprimir pedido de exemplo
async function imprimirPedidoExemplo() {
  console.log('\n🖨️ Imprimindo pedido de exemplo...');

  const payload = {
    destination: 'cozinha',
    type: 'order',
    data: {
      pizzariaName: 'PIZZARIA EXEMPLO',
      cnpj: '00.000.000/0000-00',
      address: 'Rua Exemplo, 123, Centro',
      phone: '(71) 99999-9999',
      city: 'Salvador',
      state: 'BA',
      orderNumber: '001',
      senha: '123',
      items: [
        {
          quantity: 1,
          name: 'Pizza Calabresa G',
          total: 45.00,
          observations: 'Sem cebola'
        },
        {
          quantity: 2,
          name: 'Refrigerante 2L',
          total: 20.00
        }
      ],
      total: 65.00,
      payment: {
        method: 'Dinheiro',
        paid: 70.00,
        change: 5.00
      },
      observations: 'Entregar rápido',
      footer: 'Obrigado pela preferência!'
    },
    options: {
      cutPaper: true,
      feedLines: 3
    }
  };

  const result = await request('/api/print', 'POST', payload);
  console.log('✅ Resultado:', result);
}

// Executar todos os testes
async function executarTestes() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  TESTES DO AGENTE LOCAL DE IMPRESSÃO     ║');
  console.log('╚═══════════════════════════════════════════╝');

  try {
    await testarHealth();

    // await configurarImpressoras();
    // await obterConfig();
    // await verificarStatus();
    // await testarCozinha();
    // await imprimirPedidoExemplo();

    console.log('\n✅ Testes concluídos!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

// Executar
executarTestes();
