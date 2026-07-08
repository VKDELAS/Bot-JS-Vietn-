// ============================================================
// commands/bau.js
// Comando slash /bau: envia o painel de gerenciamento do baú
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { enviarPainel } = require('../systems/bau/painel');
const { BAU_PANEL_CHANNEL_ID } = require('../config/settings');
const { ehLider } = require('../utils/permissoes');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bau')
    .setDescription('Posta o painel fixo do Baú da Facção no canal dedicado.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!ehLider(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a liderança (01/02) pode usar este comando.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const mensagem = await enviarPainel(interaction.client);

    await interaction.editReply({
      content: `✅ Painel do baú postado em <#${BAU_PANEL_CHANNEL_ID}>. [Ir até a mensagem](${mensagem.url})`,
    });
  },
};
