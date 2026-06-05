// Test script para verificar impressora USB
// Uso: node test-usb.js COM3

const { SerialPort } = require('serialport');

// Comandos ESC/POS
const ESC = '\x1B';
const GS = '\x1D';
const CMD_INIT = ESC + '@';
const CMD_CUT = GS + 'V\x01';
const CMD_ALIGN_LEFT = ESC + 'a\x00';
const CMD_ALIGN_CENTER = ESC + 'a\x01';

async function listarPortas() {
  console.log('\n📋 Portas Seriais Disponíveis:\n');

  try {
    const ports = await SerialPort.list();

    if (ports.length === 0) {
      console.log('❌ Nenhuma porta serial encontrada.');
      console.log('\n💡 Dicas:');
      console.log('   1. Conecte a impressora via USB');
      console.log('   2. Instale o driver da impressora');
      console.log('   3. Verifique no Gerenciador de Dispositivos');
      return;
    }

    ports.forEach((port, index) => {
      console.log(`${index + 1}. ${port.path}`);
      if (port.manufacturer) console.log(`   Fabricante: ${port.manufacturer}`);
      if (port.serialNumber) console.log(`   Serial: ${port.serialNumber}`);
      if (port.productId) console.log(`   Product ID: ${port.productId}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao listar portas:', error.message);
  }
}

async function testarImpressora(portaCOM) {
  console.log(`\n🖨️ Testando impressora em ${portaCOM}...\n`);

  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: portaCOM,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      autoOpen: false
    });

    const timeout = setTimeout(() => {
      port.close();
      reject(new Error(`Timeout ao abrir ${portaCOM}`));
    }, 5000);

    port.open((err) => {
      if (err) {
        clearTimeout(timeout);
        reject(new Error(`Erro ao abrir porta: ${err.message}`));
        return;
      }

      clearTimeout(timeout);
      console.log(`✅ Conectado em ${portaCOM}`);

      try {
        // Inicializar
        port.write(Buffer.from(CMD_INIT));

        setTimeout(() => {
          // Centralizar
          port.write(Buffer.from(CMD_ALIGN_CENTER));

          // Texto de teste
          const linhas = [
            '================================',
            'TESTE USB',
            '================================',
            '',
            'Porta: ' + portaCOM,
            'Data: ' + new Date().toLocaleString('pt-BR'),
            '',
            'Status: OK',
            '',
            '================================'
          ];

          linhas.forEach(linha => {
            port.write(Buffer.from(linha, 'utf8'));
            port.write(Buffer.from([0x0A]));
          });

          setTimeout(() => {
            // Cortar papel
            port.write(Buffer.from(CMD_CUT));

            setTimeout(() => {
              port.close(() => {
                console.log(`✅ Teste concluído em ${portaCOM}`);
                console.log('📄 A impressora deve ter impresso o teste.');
                resolve();
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
      console.error(`❌ Erro na porta ${portaCOM}:`, error.message);
      reject(error);
    });
  });
}

// Main
async function main() {
  const portaCOM = process.argv[2];

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔌 TESTE DE IMPRESSORA USB/SERIAL                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  await listarPortas();

  if (!portaCOM) {
    console.log('⚠️  Nenhuma porta especificada.\n');
    console.log('📝 Uso:');
    console.log('   node test-usb.js COM3');
    console.log('   node test-usb.js COM4');
    console.log('');
    process.exit(0);
  }

  try {
    await testarImpressora(portaCOM);
    console.log('\n✅ Teste finalizado com sucesso!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.log('\n💡 Dicas:');
    console.log('   1. Verifique se a porta está correta');
    console.log('   2. Verifique se a impressora está ligada');
    console.log('   3. Feche outros programas que usam a porta');
    console.log('   4. Tente outro cabo USB');
    console.log('');
    process.exit(1);
  }
}

main();
