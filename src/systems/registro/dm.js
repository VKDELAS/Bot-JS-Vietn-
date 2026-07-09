// ============================================================
// systems/registro/dm.js
// DM de boas-vindas (Components V2) enviada quando o registro é aprovado.
// Portado do bot.py antigo (embed_dm) pro formato Components V2.
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} = require('discord.js');

const { CORES, FAC_NOME } = require('../../config/settings');

/**
 * Monta o Container (Components V2) da DM de boas-vindas pós-aprovação.
 * @param {{
 *   nome: string,
 *   idFac: string,
 *   aprovadoPorTag: string,
 *   guildIconURL?: string,
 *   guildBannerURL?: string,
 *   guildNome?: string,
 * }} dados
 * @returns {ContainerBuilder}
 */
function montarContainerDMAprovado(dados) {
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  // Banner (se o servidor tiver um definido). Some silenciosamente se não houver.
  if (dados.guildBannerURL) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(dados.guildBannerURL)
      )
    );
  }

  // Título
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## BEM-VINDO À ${FAC_NOME.toUpperCase()}`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // Mensagem de boas-vindas, com o brasão/ícone do servidor como thumbnail
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Olá, **${dados.nome}**.\n` +
          `> Seu registro foi analisado e **aprovado** pela gerência. A partir de agora você faz parte da nossa família — respeite as regras, seja leal e honre nossa bandeira.`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          dados.guildIconURL || 'https://cdn.discordapp.com/embed/avatars/0.png'
        )
      )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  // Ficha do membro
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**Nome no Registro**\n${dados.nome}\n\n` +
      `**ID da Facção**\n\`${dados.idFac}\`\n\n` +
      `**Status**\nMembro Oficial`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${dados.guildNome || FAC_NOME} • Aprovado por ${dados.aprovadoPorTag}`
    )
  );

  return container;
}

/**
 * Envia a DM de boas-vindas pro membro aprovado.
 * Segue o mesmo comportamento do bot.py: se o PV estiver fechado, só loga e segue o fluxo.
 * @param {import('discord.js').GuildMember} membro
 * @param {object} dados - mesmo shape de montarContainerDMAprovado
 * @returns {Promise<boolean>} true se a DM foi enviada com sucesso
 */
async function enviarDMAprovado(membro, dados) {
  try {
    const container = montarContainerDMAprovado(dados);
    await membro.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    return true;
  } catch (erro) {
    console.log(`[registro] Não foi possível enviar DM para ${membro.displayName || membro.user?.tag} (PV fechado).`);
    return false;
  }
}

module.exports = { montarContainerDMAprovado, enviarDMAprovado };
