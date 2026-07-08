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
  const { SeparatorSpacingSize } = require('discord.js');
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  // Título colado ao conteúdo — sem divider, espaçamento mínimo no topo
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 🇻🇳 REGISTRO — ${FAC_NOME.toUpperCase()}`)
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(IMAGEM_FACCAO_URL))
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Preencha sua ficha cadastral para ingressar na facção.\n` +
      `Tenha em mãos as seguintes informações:\n\n` +
      `▸ **Nome Completo** — sem números ou caracteres especiais\n` +
      `▸ **ID** — número de identificação entre 1 e 20.000\n` +
      `▸ **Número** — DDD 01 ou 02, sem letras\n\n` +
      `> 🔺 *Após o envio, a gerência analisará sua ficha. Você será notificado no PV.*`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('registro_abrir')
        .setLabel('Registrar-se')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return container;
}


module.exports = { construirContainerRegistro };
