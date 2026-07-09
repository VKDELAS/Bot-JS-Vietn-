// ============================================================
// src/systems/registro/modals.js
// Criação e tratamento do Modal de Registro de membros.
// ============================================================

const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const { REGISTRO_LOGS_CHANNEL_ID, CORES, FAC_NOME } = require('../../config/settings');

/**
 * Constrói o Modal de Registro de Membros
 * @returns {ModalBuilder}
 */
function construirModalRegistro() {
  const modal = new ModalBuilder()
    .setCustomId('registro_modal')
    .setTitle(`📋 Registro — Facção ${FAC_NOME}`);

  const campoNome = new TextInputBuilder()
    .setCustomId('nome')
    .setLabel('Nome Completo')
    .setPlaceholder('Ex: Bruno Augusto')
    .setMinLength(3)
    .setMaxLength(40)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const campoID = new TextInputBuilder()
    .setCustomId('id_fac')
    .setLabel('ID — apenas números')
    .setPlaceholder('Ex: 8727')
    .setMinLength(1)
    .setMaxLength(5)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const campoNumero = new TextInputBuilder()
    .setCustomId('numero')
    .setLabel('Número — DDD 01 ou 02 obrigatório')
    .setPlaceholder('Ex: (02) 443-153')
    .setMinLength(5)
    .setMaxLength(20)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  // Cada campo deve ser adicionado em sua própria ActionRow
  modal.addComponents(
    new ActionRowBuilder().addComponents(campoNome),
    new ActionRowBuilder().addComponents(campoID),
    new ActionRowBuilder().addComponents(campoNumero)
  );

  return modal;
}

/**
 * Lida com o envio do modal de registro, valida os dados e envia para canal de aprovação
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleModalSubmit(interaction, client) {
  const nomeVal = interaction.fields.getTextInputValue('nome').trim();
  const idVal = interaction.fields.getTextInputValue('id_fac').trim();
  const numeroVal = interaction.fields.getTextInputValue('numero').trim();

  // Validação: nome sem números
  if (/\d/.test(nomeVal)) {
    return interaction.reply({
      content: '❌ **O nome não pode conter números!** Tente novamente.',
      ephemeral: true,
    });
  }

  // Validação: ID só números
  if (!/^\d+$/.test(idVal)) {
    return interaction.reply({
      content: '❌ **O ID deve conter apenas números!** Tente novamente.',
      ephemeral: true,
    });
  }

  const idNum = parseInt(idVal, 10);
  if (idNum < 1 || idNum > 20000) {
    return interaction.reply({
      content: '❌ **ID inválido! O ID deve ser entre 1 e 20000.** Tente novamente.',
      ephemeral: true,
    });
  }

  // Validação: número sem letras
  if (/[a-zA-Z]/.test(numeroVal)) {
    return interaction.reply({
      content: '❌ **O número não pode conter letras!** Tente novamente.',
      ephemeral: true,
    });
  }

  // DDD 01 ou 02 obrigatório
  const digitosNum = numeroVal.replace(/\D/g, '');
  if (!digitosNum.startsWith('01') && !digitosNum.startsWith('02')) {
    return interaction.reply({
      content: '❌ **O número deve começar com DDD 01 ou 02!**\nEx: (02) 443-153',
      ephemeral: true,
    });
  }

  const user = interaction.user;
  const dados = {
    discord_id: user.id,
    discord_tag: user.tag,
    nome: nomeVal,
    id_fac: idVal,
    numero: numeroVal,
    status: 'pendente',
    timestamp: new Date().toISOString(),
  };

  const registrosDir = path.join(process.cwd(), 'registros');
  if (!fs.existsSync(registrosDir)) {
    fs.mkdirSync(registrosDir, { recursive: true });
  }

  const pathRegistro = path.join(registrosDir, `${user.id}.json`);
  fs.writeFileSync(pathRegistro, JSON.stringify(dados, null, 2), 'utf8');

  const canalLogs = await client.channels.fetch(REGISTRO_LOGS_CHANNEL_ID).catch(() => null);
  if (!canalLogs) {
    return interaction.reply({
      content: '❌ Canal de logs de aprovação não encontrado. Avise um administrador.',
      ephemeral: true,
    });
  }

  // Layout CV2 limpo para aprovação
  const container = new ContainerBuilder().setAccentColor(CORES.ALERTA);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🔔 <@${user.id}> enviou um registro — <t:${Math.floor(Date.now() / 1000)}:R>`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 📋 Registro Pendente\n-# Aguardando análise da gerência`
        )
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(user.displayAvatarURL({ dynamic: true }))
      )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `**Discord** · <@${user.id}>\n` +
      `**Nome** · ${nomeVal}\n` +
      `**ID** · \`${idVal}\`\n` +
      `**Número** · \`${numeroVal}\``
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`registro_aprovar__${user.id}`)
        .setLabel('Aprovar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`registro_reprovar__${user.id}`)
        .setLabel('Reprovar')
        .setStyle(ButtonStyle.Danger)
    )
  );

  const msg = await canalLogs.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  dados.msg_id = msg.id;
  fs.writeFileSync(pathRegistro, JSON.stringify(dados, null, 2), 'utf8');

  await interaction.reply({
    content: '✅ **Registro enviado com sucesso!** Aguarde a aprovação de um superior.',
    ephemeral: true,
  });
}

module.exports = { construirModalRegistro, handleModalSubmit };
