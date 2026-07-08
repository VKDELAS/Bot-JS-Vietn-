// ============================================================
// utils/formatarLinha.js
// Padrão de formatação de linhas de item no estoque.
// ============================================================

function formatarLinhaItem(emoji, nome, quantidade, sufixo = '') {
  const prefixo = emoji ? `${emoji} ` : '';
  return `${prefixo}${nome} — ${quantidade}${sufixo}`;
}

function formatarOpcaoDisponivel(emoji, nome, quantidade) {
  // Usado no Select Menu de Retirar Item: "🔫 AK-47 (3 disponíveis)"
  const prefixo = emoji ? `${emoji} ` : '';
  return `${prefixo}${nome} (${quantidade} disponíve${quantidade === 1 ? 'l' : 'is'})`;
}

module.exports = { formatarLinhaItem, formatarOpcaoDisponivel };
