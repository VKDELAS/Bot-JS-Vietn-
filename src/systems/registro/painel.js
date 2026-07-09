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
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { IMAGEM_FACCAO_URL, CORES, FAC_NOME } = require('../../config/settings');

// ⚠️ Link de attachment do Discord expira (tem assinatura `ex=`/`is=`/`hm=`).
// Troque por um host permanente (Imgur, CDN próprio) assim que possível,
// senão o banner vai quebrar quando o link vencer.
const BANNER_REGISTRO_URL =
  'https://cdn.discordapp.com/attachments/1487938963317719306/1524558767142862948/content.png?ex=6a502f7f&is=6a4eddff&hm=7e7040530d3b111ffbdf025e42ec00e3af86d9d15afa8a99e0fffaef8a2103dc&';

/**
 * Constrói o layout do painel de registro usando Components V2 para máxima sofisticação.
 * Ordem: título → banner → descrição/requisitos → botão.
 * @returns {ContainerBuilder}
 */
function construirContainerRegistro() {
  const container = new ContainerBuilder().setAccentColor(CORES.VIETNA);

  // Título no topo, sozinho — sem thumbnail, já que o banner abaixo cumpre esse papel visual
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# 🇻🇳 REGISTRO — ${FAC_NOME.toUpperCase()}`)
  );

  // Banner logo abaixo do título
  container.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(BANNER_REGISTRO_URL)
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  // Descrição + requisitos, com redação mais direta e profissional
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `Para ingressar na facção, preencha a ficha cadastral abaixo com atenção. ` +
      `Antes de começar, tenha em mãos:\n\n` +
      `▸ **Nome Completo** — sem números ou caracteres especiais\n` +
      `▸ **ID** — identificação numérica entre \`1\` e \`20.000\`\n` +
      `▸ **Número** — DDD \`01\` ou \`02\`, apenas dígitos\n\n` +
      `> 🔺 *Após o envio, sua ficha será analisada pela gerência. O resultado será enviado por mensagem direta (PV).*`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('registro_abrir')
        .setLabel('Registrar-se')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return container;
}

module.exports = { construirContainerRegistro };
