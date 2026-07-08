// ============================================================
// systems/registro/painel.js
// Monta o Container (Components V2) do painel de registro.
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
} = require('discord.js');

const { IMAGEM_FACCAO_URL, CORES, FAC_NOME } = require('../../config/settings');

/**
 * Constrói o layout do painel de registro usando Components V2 para máxima sofisticação
 * @returns {ContainerBuilder}
 */
function construirContainerRegistro() {
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 🇻🇳 REGISTRO — FACÇÃO ${FAC_NOME.toUpperCase()}`)
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(IMAGEM_FACCAO_URL))
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Seja bem-vindo ao recrutamento e registro oficial do **${FAC_NOME}**!\n\n` +
      `Para ingressar em nossa facção, clique no botão abaixo para preencher sua ficha cadastral. ` +
      `Tenha em mãos as seguintes informações:\n\n` +
      `🪪 **Nome Completo** — (Sem números ou caracteres especiais)\n` +
      `🆔 **ID** — (Apenas o seu número de identificação, entre 1 e 20000)\n` +
      `📞 **Número de Contato** — (DDD 01 ou 02 obrigatório, sem letras)\n\n` +
      `> ⚠️ *Após enviar o formulário, nossa gerência analisará seu pedido. Você receberá um aviso no PV quando for aprovado ou reprovado.*`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('registro_abrir')
        .setLabel('Registrar-se')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return container;
}

module.exports = { construirContainerRegistro };
