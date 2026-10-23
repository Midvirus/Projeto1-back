const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'errors.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function formatarData() {
  const agora = new Date();
  const d = agora.toLocaleDateString('pt-BR');
  const t = agora.toLocaleTimeString('pt-BR');
  return `${d} ${t}`;
}

function registrar(tipo, operacao, mensagem) {
  const entrada =
    `[${formatarData()}]\n` +
    `ERRO: ${tipo}\n` +
    `OPERACAO: ${operacao}\n` +
    `MENSAGEM: ${mensagem}\n` +
    `${'─'.repeat(40)}\n`;

  fs.appendFileSync(logFile, entrada, 'utf8');
  console.error(`[LOG] ${tipo} | ${operacao} | ${mensagem}`);
}

module.exports = { registrar };
