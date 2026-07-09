// ============================================================
// systems/boasvindas/mensagens.js
// Mensagens de entrada e saída de membros (Components V2),
// tematizadas pra Facção Vietnã.
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

const {
  CORES,
  FAC_NOME,
  ENTRADA_CHANNEL_ID,
  SAIDA_CHANNEL_ID,
} = require('../../config/settings');

/**
 * Monta o Container (Components V2) de boas-vindas quando alguém entra no servidor.
 * @param {import('discord.js').GuildMember} membro
 * @returns {ContainerBuilder}
 */
function montarContainerEntrada(membro) {
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 🇻🇳 Bem-vindo à Facção ${FAC_NOME}!\n` +
          `Salve, ${membro}! 🎌 Você acabou de entrar no território oficial da **${FAC_NOME}**.\n\n` +
          `Dirija-se ao canal de registro e preencha sua ficha pra fazer parte da família.\n\n` +
          `-# *Respeito, lealdade e honra — os pilares do ${FAC_NOME}.*`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(membro.displayAvatarURL({ size: 256 }))
      )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${FAC_NOME} • ${membro.guild.memberCount} membros`
    )
  );

  return container;
}

/**
 * Monta o Container (Components V2) de despedida quando alguém sai do servidor.
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} membro
 * @returns {ContainerBuilder}
 */
function montarContainerSaida(membro) {
  const container = new ContainerBuilder().setAccentColor(CORES.MUTED);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 👋 Saiu da Facção ${FAC_NOME}\n` +
          `**${membro.displayName || membro.user.username}** deixou o servidor.\n\n` +
          `-# *Uma vez ${FAC_NOME}, sempre ${FAC_NOME}. Vai com Deus, soldado.*`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(membro.displayAvatarURL({ size: 256 }))
      )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${FAC_NOME} • ${membro.guild.memberCount} membros`
    )
  );

  return container;
}

/**
 * Envia a mensagem de boas-vindas no canal configurado.
 * @param {import('discord.js').GuildMember} membro
 */
async function enviarMensagemEntrada(membro) {
  try {
    const canal = await membro.guild.channels.fetch(ENTRADA_CHANNEL_ID);
    if (!canal) return;

    await canal.send({
      components: [montarContainerEntrada(membro)],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (erro) {
    console.error('[boasvindas] Falha ao enviar mensagem de entrada:', erro.message);
  }
}

/**
 * Envia a mensagem de despedida no canal configurado.
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} membro
 */
async function enviarMensagemSaida(membro) {
  try {
    const canal = await membro.guild.channels.fetch(SAIDA_CHANNEL_ID);
    if (!canal) return;

    await canal.send({
      components: [montarContainerSaida(membro)],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (erro) {
    console.error('[boasvindas] Falha ao enviar mensagem de saída:', erro.message);
  }
}

module.exports = {
  montarContainerEntrada,
  montarContainerSaida,
  enviarMensagemEntrada,
  enviarMensagemSaida,
};
