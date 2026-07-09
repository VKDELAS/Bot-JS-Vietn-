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
 *   guildNome?: string,
 * }} dados
 * @returns {ContainerBuilder}
 */
function montarContainerDMAprovado(dados) {
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  // Título
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# 🇻🇳 Bem-vindo(a) à Facção ${FAC_NOME}!`)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // Mensagem de boas-vindas + ficha, com o brasão/ícone do servidor como thumbnail
  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Olá, **${dados.nome}**! Seu registro foi analisado e **APROVADO** pela nossa gerência.\n\n` +
          `Agora você faz parte da nossa família. Respeite as regras, seja leal e honre nossa bandeira.\n\n` +
          `**Nome no Registro** · ${dados.nome}\n` +
          `**Seu ID** · \`${dados.idFac}\`\n` +
          `**Status** · ✅ Membro Oficial`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
          dados.guildIconURL || 'https://cdn.discordapp.com/embed/avatars/0.png'
        )
      )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

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
