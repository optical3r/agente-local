const net = require('net');
const fs = require('fs');
const path = require('path');
const { SerialPort } = require('serialport');
const { formatOrder } = require('./formatter');

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Comandos ESC/POS (validados conforme documentação oficial)
// Referência: https://elgindevelopercommunity.github.io/
// ESC/POS Standard: https://escpos.readthedocs.io/

const ESC = '\x1B';  // 0x1B = 27
const GS = '\x1D';   // 0x1D = 29
const LF = '\x0A';   // 0x0A = 10 (line feed)

// Inicialização (ESC @) - 0x1B 0x40
// Reseta buffer e configurações para padrão
const CMD_INIT = ESC + '@';

// Corte de papel (GS V) - 0x1D 0x56
// Modo 1 = corte parcial (deixa 1 ponto conectado)
const CMD_CUT = GS + 'V\x01';

// Abertura de gaveta (ESC p) - 0x1B 0x70 0x00 0x19 0xFA
// Pin 2, pulso 25ms ON, 250ms OFF
const CMD_DRAWER = ESC + 'p\x00\x19\xFA';

// Avanço de papel (ESC d) - 0x1B 0x64 [n]
// n = número de linhas (1-255)
const CMD_FEED = (lines) => ESC + 'd' + String.fromCharCode(lines);

// Alinhamento (ESC a) - 0x1B 0x61 [n]
// 0 = esquerda, 1 = centro, 2 = direita
const CMD_ALIGN_LEFT = ESC + 'a\x00';
const CMD_ALIGN_CENTER = ESC + 'a\x01';
const CMD_ALIGN_RIGHT = ESC + 'a\x02';

// Negrito (ESC E) - 0x1B 0x45 [n]
// 0 = desliga, 1 = liga
const CMD_BOLD_ON = ESC + 'E\x01';
const CMD_BOLD_OFF = ESC + 'E\x00';

// Configuração padrão
let config = {
  balcao: { type: 'm8_internal' },
  cozinha: { type: 'm8_internal' }
};

// Carregar configuração do arquivo
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
      console.log('✅ Configuração carregada:', config);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar config:', error);
  }
}

// Salvar configuração no arquivo
function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('💾 Configuração salva');
  } catch (error) {
    console.error('❌ Erro ao salvar config:', error);
  }
}

// Inicializar
loadConfig();

// Configurar impressoras
async function configurePrinters(newConfig) {
  config = newConfig;
  saveConfig();

  return {
    success: true,
    message: 'Impressoras configuradas',
    config: config
  };
}

// Imprimir via TCP/IP ESC/POS (Elgin i8 compatível)
async function printToNetwork(ip, port, text, options = {}) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    // Timeout de conexão: 5 segundos
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timeout ao conectar em ${ip}:${port}`));
    }, 5000);

    socket.connect(port, ip, () => {
      clearTimeout(timeout);
      console.log(`✅ Conectado em ${ip}:${port}`);

      try {
        // SEQUÊNCIA CORRETA PARA ELGIN i8:

        // 1. Inicializar impressora (limpa buffer, reseta configurações)
        socket.write(Buffer.from(CMD_INIT));

        // Pequena pausa para processamento
        setTimeout(() => {
          // 2. Alinhar à esquerda (padrão)
          socket.write(Buffer.from(CMD_ALIGN_LEFT));

          // 3. Imprimir texto linha por linha
          const lines = text.split('\n');
          lines.forEach(line => {
            // Converter texto para buffer (UTF-8)
            const lineBuffer = Buffer.from(line, 'utf8');
            socket.write(lineBuffer);

            // Line feed
            socket.write(Buffer.from([0x0A]));
          });

          // 4. Avançar papel (se solicitado)
          if (options.feedLines && options.feedLines > 0) {
            const feedCmd = CMD_FEED(Math.min(options.feedLines, 255));
            socket.write(Buffer.from(feedCmd));
          }

          // Aguardar impressão completar antes de cortar
          setTimeout(() => {
            // 5. Cortar papel (se solicitado)
            if (options.cutPaper) {
              socket.write(Buffer.from(CMD_CUT));
            }

            // 6. Abrir gaveta (se solicitado)
            if (options.openDrawer) {
              socket.write(Buffer.from(CMD_DRAWER));
            }

            // Aguardar comandos finalizarem
            setTimeout(() => {
              socket.end();

              console.log(`✅ Impresso em ${ip}:${port} (${lines.length} linhas)`);
              resolve({
                success: true,
                message: `Impresso em ${ip}:${port}`,
                ip: ip,
                port: port,
                lines: lines.length
              });
            }, 200); // 200ms para gaveta/corte

          }, 100); // 100ms para impressão finalizar

        }, 50); // 50ms para inicialização

      } catch (error) {
        socket.destroy();
        reject(error);
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ Erro socket ${ip}:${port}:`, error.message);
      reject(new Error(`Erro de conexão: ${error.message}`));
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout de leitura em ${ip}:${port}`));
    });

    // Timeout de leitura: 10 segundos
    socket.setTimeout(10000);
  });
}

// Imprimir via USB/Serial (Elgin i8 compatível)
async function printToUSB(comPort, text, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Abrindo porta serial ${comPort}...`);

    const port = new SerialPort({
      path: comPort,
      baudRate: options.baudRate || 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      autoOpen: false
    });

    // Timeout de abertura: 5 segundos
    const openTimeout = setTimeout(() => {
      port.close();
      reject(new Error(`Timeout ao abrir porta ${comPort}`));
    }, 5000);

    port.open((err) => {
      if (err) {
        clearTimeout(openTimeout);
        console.error(`❌ Erro ao abrir ${comPort}:`, err.message);
        reject(new Error(`Erro ao abrir porta: ${err.message}`));
        return;
      }

      clearTimeout(openTimeout);
      console.log(`✅ Conectado em ${comPort}`);

      try {
        // SEQUÊNCIA CORRETA PARA ELGIN i8:

        // 1. Inicializar impressora (limpa buffer, reseta configurações)
        port.write(Buffer.from(CMD_INIT));

        // Pequena pausa para processamento
        setTimeout(() => {
          // 2. Alinhar à esquerda (padrão)
          port.write(Buffer.from(CMD_ALIGN_LEFT));

          // 3. Imprimir texto linha por linha
          const lines = text.split('\n');
          lines.forEach(line => {
            // Converter texto para buffer (UTF-8)
            const lineBuffer = Buffer.from(line, 'utf8');
            port.write(lineBuffer);

            // Line feed
            port.write(Buffer.from([0x0A]));
          });

          // 4. Avançar papel (se solicitado)
          if (options.feedLines && options.feedLines > 0) {
            const feedCmd = CMD_FEED(Math.min(options.feedLines, 255));
            port.write(Buffer.from(feedCmd));
          }

          // Aguardar impressão completar antes de cortar
          setTimeout(() => {
            // 5. Cortar papel (se solicitado)
            if (options.cutPaper) {
              port.write(Buffer.from(CMD_CUT));
            }

            // 6. Abrir gaveta (se solicitado)
            if (options.openDrawer) {
              port.write(Buffer.from(CMD_DRAWER));
            }

            // Aguardar comandos finalizarem
            setTimeout(() => {
              port.close((closeErr) => {
                if (closeErr) {
                  console.warn(`⚠️ Aviso ao fechar ${comPort}:`, closeErr.message);
                }
              });

              console.log(`✅ Impresso em ${comPort} (${lines.length} linhas)`);
              resolve({
                success: true,
                message: `Impresso em ${comPort}`,
                port: comPort,
                lines: lines.length
              });
            }, 200); // 200ms para gaveta/corte

          }, 100); // 100ms para impressão finalizar

        }, 50); // 50ms para inicialização

      } catch (error) {
        port.close();
        reject(error);
      }
    });

    port.on('error', (error) => {
      console.error(`❌ Erro porta ${comPort}:`, error.message);
      reject(new Error(`Erro na porta serial: ${error.message}`));
    });
  });
}

// Listar portas seriais disponíveis
async function listSerialPorts() {
  try {
    const ports = await SerialPort.list();
    console.log(`📋 Portas seriais encontradas: ${ports.length}`);

    return ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer || 'Desconhecido',
      serialNumber: port.serialNumber || '',
      productId: port.productId || '',
      vendorId: port.vendorId || ''
    }));
  } catch (error) {
    console.error('❌ Erro ao listar portas:', error);
    return [];
  }
}

// Imprimir em uma impressora
async function printToDestination(destination, payload) {
  const destConfig = destination === 'balcao' ? config.balcao : config.cozinha;

  console.log(`🎯 Destino: ${destination}`);
  console.log(`   Config:`, destConfig);

  // Formatar texto
  const text = payload.rawText || formatOrder(payload.data, payload.options);

  // Gaveta abre SOMENTE no balcão (requisito do contrato).
  // Clona options removendo openDrawer quando não for o slot balcão.
  const baseOptions = payload.options || {};
  const options = (destination === 'balcao')
    ? baseOptions
    : { ...baseOptions, openDrawer: false };

  // Suporte USB/Serial
  if (destConfig.type === 'usb' || destConfig.type === 'serial') {
    if (!destConfig.port) {
      return {
        success: false,
        error: `Porta COM não configurada para ${destination}`,
        destination: destination
      };
    }

    const result = await printToUSB(
      destConfig.port,
      text,
      options
    );

    result.destination = destination;
    return result;
  }

  // Suporte TCP/IP. 'm8_internal' é tratado como rede (i8_network) por configuração.
  if (destConfig.type === 'i8_network' || destConfig.type === 'm8_internal') {
    if (!destConfig.ip) {
      return {
        success: false,
        error: `IP da ${destination} não configurado`,
        destination: destination
      };
    }

    const port = destConfig.port || 9100;
    const result = await printToNetwork(
      destConfig.ip,
      port,
      text,
      options
    );

    result.destination = destination;
    result.port = port;
    return result;
  }

  // Tipo não suportado
  return {
    success: false,
    error: `Tipo de impressora não suportado: ${destConfig.type}. Use 'i8_network', 'm8_internal', 'usb' ou 'serial'`,
    destination: destination
  };
}

// Imprimir (suporta balcão/cozinha/ambos)
async function print(payload) {
  const destination = payload.destination || 'balcao';

  console.log(`🖨️ Destino: ${destination}`);

  if (destination === 'ambos') {
    // Imprimir em ambas
    const results = [];

    try {
      const balcaoResult = await printToDestination('balcao', payload);
      results.push(balcaoResult);
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        destination: 'balcao'
      });
    }

    try {
      const cozinhaResult = await printToDestination('cozinha', payload);
      results.push(cozinhaResult);
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        destination: 'cozinha'
      });
    }

    const allSuccess = results.every(r => r.success);

    return {
      success: allSuccess,
      message: allSuccess ? 'Impresso em ambas' : 'Erro em pelo menos uma impressora',
      results: results
    };

  } else {
    // Imprimir em uma só
    return await printToDestination(destination, payload);
  }
}

// Testar impressora
async function testPrinter(destination) {
  const testPayload = {
    type: 'test',
    destination: destination,
    rawText: `================================
TESTE IMPRESSORA ${destination.toUpperCase()}
================================

Este é um teste de impressão.

Data/Hora: ${new Date().toLocaleString()}

================================`,
    options: {
      cutPaper: true,
      feedLines: 3
    }
  };

  return await print(testPayload);
}

// Verificar se impressora está acessível
async function checkPrinter(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 2000);

    socket.connect(port, ip, () => {
      clearTimeout(timeout);
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Verifica disponibilidade de um slot conforme o tipo de conexão
async function checkSlot(slotConfig) {
  if (!slotConfig) return false;

  // Rede (i8_network ou m8_internal configurado como rede): testa socket TCP
  if (slotConfig.type === 'i8_network' || slotConfig.type === 'm8_internal') {
    return slotConfig.ip
      ? await checkPrinter(slotConfig.ip, slotConfig.port || 9100)
      : false;
  }

  // USB/Serial: disponível se a porta COM configurada existir na lista
  if (slotConfig.type === 'usb' || slotConfig.type === 'serial') {
    if (!slotConfig.port) return false;
    const ports = await listSerialPorts();
    return ports.some(p => p.path === slotConfig.port);
  }

  return false;
}

// Obter status
async function getStatus() {
  const balcaoAvailable = await checkSlot(config.balcao);
  const cozinhaAvailable = await checkSlot(config.cozinha);

  return {
    success: true,
    status: {
      balcao: {
        config: config.balcao,
        available: balcaoAvailable,
        connected: balcaoAvailable
      },
      cozinha: {
        config: config.cozinha,
        available: cozinhaAvailable,
        connected: cozinhaAvailable
      }
    }
  };
}

// Obter configuração
async function getConfig() {
  return {
    success: true,
    config: config
  };
}

module.exports = {
  configurePrinters,
  print,
  testPrinter,
  getStatus,
  getConfig,
  listSerialPorts
};
