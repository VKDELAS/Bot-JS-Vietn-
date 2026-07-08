// ============================================================
// systems/bau/log.js
// Log automático de movimentações do baú.
// ============================================================

const { BAU_LOG_CHANNEL_ID } = require('../../config/settings');
const { formatarDataHora } = require('../../utils/data');

const VERBOS = {
  entrada: 'guardou',
  saida: 'retirou',
  ajuste_manual: 'ajustou manualmente',
};

const EMOJIS = {
  entrada: '📥',
  saida: '📤',
  ajuste_manual: '✏️',
};

/**
 * @param {import('discord.js').Client} client
 * @param {{ usuarioTag: string, tipo: 'entrada'|'saida'|'ajuste_manual', quantidade: number, itemNome: string, itemEmoji?: string }} dados
 */
async function logarMovimentacao(client, dados) {
  try {
    const canal = await client.channels.fetch(BAU_LOG_CHANNEL_ID);
    const emoji = EMOJIS[dados.tipo] || '📦';
    const verbo = VERBOS[dados.tipo] || dados.tipo;
    const agora = formatarDataHora(new Date().toISOString());

    const texto = `${emoji} **${dados.usuarioTag}** ${verbo} ${dados.quantidade}x ${
      dados.itemEmoji || ''
    } ${dados.itemNome} do baú — ${agora}`;

    await canal.send({ content: texto });
  } catch (erro) {
    console.error('[bau] Falha ao enviar log de movimentação:', erro.message);
  }
}

module.exports = { logarMovimentacao };
