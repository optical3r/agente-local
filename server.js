const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
  configurePrinters,
  print,
  testPrinter,
  getStatus,
  getConfig,
  listSerialPorts
} = require('./printer');

const app = express();
const PORT = 3000;
const AGENT_VERSION = require('./package.json').version;
const START_TIME = Date.now();

// Criar pasta logs/ se não existir
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📁 Pasta logs/ criada');
}

// Origens autorizadas (PWA). Configurável via ALLOWED_ORIGINS (separado por vírgula).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'https://pizza-bahia-connect.vercel.app',
      'http://localhost:5173'
    ]
);

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem Origin (curl, mesma máquina) e as origens autorizadas.
    // Origem não autorizada: responde sem o header de permissão (callback(null,false))
    // em vez de lançar erro — o navegador bloqueia, mas não geramos HTTP 500.
    const allowed = !origin || ALLOWED_ORIGINS.includes(origin);
    if (!allowed) {
      console.warn(`⚠️ Origem não autorizada bloqueada: ${origin}`);
    }
    return callback(null, allowed);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Logs de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (contrato do PWA)
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    agent_version: AGENT_VERSION,
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000)
  });
});

// Configurar impressoras
app.post('/api/configure', async (req, res) => {
  try {
    const config = req.body;
    console.log('📋 Configurando impressoras:', JSON.stringify(config, null, 2));

    const result = await configurePrinters(config);

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao configurar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Imprimir
app.post('/api/print', async (req, res) => {
  try {
    const payload = req.body;
    console.log('🖨️ Imprimindo:', {
      type: payload.type,
      destination: payload.destination,
      orderNumber: payload.data?.orderNumber
    });

    const result = await print(payload);

    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Testar impressora do balcão
app.post('/api/test/balcao', async (req, res) => {
  try {
    console.log('🧪 Testando balcão...');
    const result = await testPrinter('balcao');
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao testar balcão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Testar impressora da cozinha
app.post('/api/test/cozinha', async (req, res) => {
  try {
    console.log('🧪 Testando cozinha...');
    const result = await testPrinter('cozinha');
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao testar cozinha:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter status
app.get('/api/status', async (req, res) => {
  try {
    const result = await getStatus();
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obter configuração
app.get('/api/config', async (req, res) => {
  try {
    const result = await getConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao obter config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listar portas seriais disponíveis
app.get('/api/ports', async (req, res) => {
  try {
    console.log('📋 Listando portas seriais...');
    const ports = await listSerialPorts();

    res.json({
      success: true,
      ports: ports,
      count: ports.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar portas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ======================================');
  console.log('🚀 AGENTE LOCAL DE IMPRESSÃO');
  console.log('🚀 ======================================');
  console.log(`🚀 Rodando em: http://localhost:${PORT}`);
  console.log('🚀 Health: http://localhost:3000/health');
  console.log('🚀 ======================================');
  console.log('');
});

module.exports = app;
