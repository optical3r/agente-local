const WIDTH = 32;

// Quebrar linha respeitando palavras
function wrapLine(text, maxWidth) {
  if (text.length <= maxWidth) return [text];

  const lines = [];
  let currentLine = '';
  const words = text.split(' ');

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

// Centralizar texto
function center(text) {
  const padding = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return ' '.repeat(padding) + text;
}

// Linha de separação
function separator(char = '=') {
  return char.repeat(WIDTH);
}

// Formatar preço
function formatPrice(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

// Formatar pedido
function formatOrder(data, options = {}) {
  const lines = [];

  // Cabeçalho
  lines.push(separator('='));
  if (data.pizzariaName) {
    lines.push(center(data.pizzariaName));
  }
  lines.push(separator('='));
  lines.push('');

  // CNPJ, endereço, etc.
  if (data.cnpj) {
    lines.push(`CNPJ: ${data.cnpj}`);
  }
  if (data.address) {
    wrapLine(data.address, WIDTH).forEach(l => lines.push(l));
  }
  if (data.phone) {
    lines.push(`Tel: ${data.phone}`);
  }
  if (data.city && data.state) {
    lines.push(`${data.city} - ${data.state}`);
  }

  lines.push('');
  lines.push(separator('-'));

  // Número do pedido e senha
  if (data.senha) {
    lines.push(center(`SENHA: ${data.senha}`));
  }
  lines.push(center(`Pedido: ${data.orderNumber}`));
  lines.push(separator('-'));
  lines.push('');

  // Itens
  if (data.items && data.items.length > 0) {
    data.items.forEach(item => {
      // Nome do item
      const itemName = `${item.quantity}x ${item.name}`;
      wrapLine(itemName, WIDTH).forEach(l => lines.push(l));

      // Preço
      if (item.total !== undefined) {
        const priceStr = formatPrice(item.total);
        lines.push(' '.repeat(WIDTH - priceStr.length) + priceStr);
      }

      // Observações
      if (item.observations) {
        wrapLine(`  Obs: ${item.observations}`, WIDTH).forEach(l => lines.push(l));
      }

      lines.push('');
    });
  }

  lines.push(separator('-'));

  // Total
  if (data.total !== undefined) {
    const totalStr = formatPrice(data.total);
    const totalLabel = 'TOTAL:';
    const totalLine = totalLabel + ' '.repeat(WIDTH - totalLabel.length - totalStr.length) + totalStr;
    lines.push(totalLine);
  }

  // Pagamento
  if (data.payment) {
    lines.push('');
    lines.push(`Pagamento: ${data.payment.method}`);

    if (data.payment.paid) {
      lines.push(`Pago: ${formatPrice(data.payment.paid)}`);
    }

    if (data.payment.change) {
      lines.push(`Troco: ${formatPrice(data.payment.change)}`);
    }
  }

  // Observações gerais
  if (data.observations) {
    lines.push('');
    lines.push('Observacoes:');
    wrapLine(data.observations, WIDTH).forEach(l => lines.push(l));
  }

  lines.push('');
  lines.push(separator('='));

  // Rodapé
  if (data.footer) {
    lines.push('');
    wrapLine(data.footer, WIDTH).forEach(l => lines.push(center(l)));
  }

  lines.push('');
  lines.push(center('Obrigado!'));
  lines.push(separator('='));

  return lines.join('\n');
}

module.exports = {
  formatOrder,
  center,
  separator,
  formatPrice,
  wrapLine
};
