// ============================================================
// commands/inicial.js
// Slash command /inicial: envia o painel de registro no canal
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { construirContainerRegistro } = require('../systems/registro/painel');
const { REGISTRO_CHANNEL_ID } = require('../config/settings');
const { ehLider } = require('../utils/permissoes');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inicial')
    .setDescription('Posta o painel fixo de registro da facção no canal dedicado.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Apenas Líder 01 ou 02 pode postar o painel de registro
    if (!ehLider(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a liderança (01/02) pode usar este comando.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const canal = await interaction.client.channels.fetch(REGISTRO_CHANNEL_ID).catch(() => null);
    if (!canal) {
      return interaction.editReply({
        content: `❌ Canal de registro (${REGISTRO_CHANNEL_ID}) não foi encontrado. Verifique as configurações.`,
      });
    }

    const container = construirContainerRegistro();

    const msg = await canal.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    await interaction.editReply({
      content: `✅ Painel de registro postado com sucesso em <#${REGISTRO_CHANNEL_ID}>. [Ir até a mensagem](${msg.url})`,
    });
  },
};
