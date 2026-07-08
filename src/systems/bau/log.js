// ============================================================
// systems/bau/log.js
// Log automático de movimentações do baú (Components V2).
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  MessageFlags,
  SeparatorSpacingSize,
} = require('discord.js');

const { BAU_LOG_CHANNEL_ID, CORES } = require('../../config/settings');

const CONFIG = {
  entrada: {
    emoji: '📥',
    verbo: 'guardou',
    cor: 0x2ecc71,          // verde
    badge: '`＋ ENTRADA`',
  },
  saida: {
    emoji: '📤',
    verbo: 'retirou',
    cor: 0xe74c3c,          // vermelho
    badge: '`－ SAÍDA`',
  },
  ajuste_manual: {
    emoji: '✏️',
    verbo: 'ajustou',
    cor: 0xffb800,          // amarelo
    badge: '`⚡ AJUSTE`',
  },
};

/**
 * @param {import('discord.js').Client} client
 * @param {{
 *   usuarioTag: string,
 *   usuarioId?: string,
 *   tipo: 'entrada'|'saida'|'ajuste_manual',
 *   quantidade: number,
 *   itemNome: string,
 *   itemEmoji?: string
 * }} dados
 */
async function logarMovimentacao(client, dados) {
  try {
    const canal = await client.channels.fetch(BAU_LOG_CHANNEL_ID);
    const cfg = CONFIG[dados.tipo] || CONFIG.entrada;
    const agora = Math.floor(Date.now() / 1000);
    const itemLabel = `${dados.itemEmoji || '📦'} ${dados.itemNome}`;
    const sinalQtd = dados.tipo === 'entrada' ? '+' : dados.tipo === 'saida' ? '-' : '±';

    const container = new ContainerBuilder().setAccentColor(cfg.cor);

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
    );

    // Bloco do item (sem thumbnail — texto puro centraliza melhor)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${cfg.badge}\n## ${cfg.emoji} ${itemLabel}\n-# ${sinalQtd}${dados.quantidade} unidade${dados.quantidade !== 1 ? 's' : ''}`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    // Bloco do usuário — avatar fica ao lado direito desta section
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Membro** · ${dados.usuarioId ? `<@${dados.usuarioId}>` : `\`${dados.usuarioTag}\``}\n` +
            `**Quando** · <t:${agora}:f> — <t:${agora}:R>`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(
            dados.usuarioAvatarURL ||
            `https://cdn.discordapp.com/embed/avatars/0.png`
          )
        )
    );

    await canal.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (erro) {
    console.error('[bau] Falha ao enviar log de movimentação:', erro.message);
  }
}

module.exports = { logarMovimentacao };
