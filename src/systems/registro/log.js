// ============================================================
// systems/registro/log.js
// Log de registros (Components V2) — pendente / aprovado / reprovado.
// Portado do bot.py antigo (embeds) pro formato Components V2.
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const { REGISTRO_LOGS_CHANNEL_ID } = require('../../config/settings');

const CONFIG = {
  pendente: {
    emoji: '📥',
    cor: 0xffb800,          // amarelo
    badge: '`⏳ PENDENTE`',
  },
  aprovado: {
    emoji: '✅',
    cor: 0x2ecc71,          // verde
    badge: '`✔ APROVADO`',
  },
  reprovado: {
    emoji: '❌',
    cor: 0xe74c3c,          // vermelho
    badge: '`✕ REPROVADO`',
  },
};

/**
 * Monta o Container (Components V2) do log de registro pra qualquer status.
 * @param {{
 *   usuarioId: string,
 *   usuarioTag: string,
 *   usuarioAvatarURL?: string,
 *   nome: string,
 *   idFac: string,
 *   numero: string,
 *   status: 'pendente'|'aprovado'|'reprovado',
 *   decididoPorTag?: string,   // quem aprovou/reprovou
 * }} dados
 * @returns {ContainerBuilder}
 */
function montarContainerLogRegistro(dados) {
  const cfg = CONFIG[dados.status] || CONFIG.pendente;
  const agora = Math.floor(Date.now() / 1000);

  const container = new ContainerBuilder().setAccentColor(cfg.cor);

  // Bloco principal: badge + ficha + avatar do candidato
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${cfg.badge}\n` +
          `### ${cfg.emoji} Registro — ${dados.nome}\n` +
          `**Discord** · <@${dados.usuarioId}>\n` +
          `**ID** · \`${dados.idFac}\`   **Número** · \`${dados.numero}\`\n` +
          `**Enviado** · <t:${agora}:R>`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          dados.usuarioAvatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png'
        )
      )
  );

  // Rodapé de decisão — só aparece depois que já foi aprovado/reprovado
  if (dados.status !== 'pendente' && dados.decididoPorTag) {
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# ${dados.status === 'aprovado' ? 'Aprovado' : 'Reprovado'} por **${dados.decididoPorTag}**`
      )
    );
  }

  // Botões só ficam ativos enquanto pendente
  const aprovarBtn = new ButtonBuilder()
    .setCustomId(`registro_aprovar_${dados.usuarioId}`)
    .setLabel('Aprovar')
    .setEmoji('✅')
    .setStyle(ButtonStyle.Success)
    .setDisabled(dados.status !== 'pendente');

  const reprovarBtn = new ButtonBuilder()
    .setCustomId(`registro_reprovar_${dados.usuarioId}`)
    .setLabel('Reprovar')
    .setEmoji('❌')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(dados.status !== 'pendente');

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(aprovarBtn, reprovarBtn)
  );

  return container;
}

/**
 * Envia o log inicial (status pendente) no canal de logs de registro.
 * @param {import('discord.js').Client} client
 * @param {object} dados - mesmo shape de montarContainerLogRegistro, sem status/decididoPorTag
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function enviarLogRegistro(client, dados) {
  try {
    const canal = await client.channels.fetch(REGISTRO_LOGS_CHANNEL_ID);
    const container = montarContainerLogRegistro({ ...dados, status: 'pendente' });

    return await canal.send({
      content: `🔔 Novo registro de <@${dados.usuarioId}> aguardando aprovação!`,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (erro) {
    console.error('[registro] Falha ao enviar log de registro:', erro.message);
    return null;
  }
}

/**
 * Atualiza a mensagem de log existente pra refletir aprovação/reprovação
 * (badge muda, rodapé com quem decidiu, botões desativados).
 * @param {import('discord.js').Message} mensagem - mensagem original do log (interaction.message)
 * @param {object} dados - mesmo shape de montarContainerLogRegistro, com status já definido
 */
async function atualizarLogRegistro(mensagem, dados) {
  const container = montarContainerLogRegistro(dados);
  await mensagem.edit({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = { montarContainerLogRegistro, enviarLogRegistro, atualizarLogRegistro };
