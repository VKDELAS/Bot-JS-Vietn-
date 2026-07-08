// ============================================================
// systems/bau/index.js
// Ponto de entrada do sistema.
// ============================================================

const { Events } = require('discord.js');
const { handleButton } = require('./botoes');
const { handleSelectMenu } = require('./selects');
const { handleModalSubmit } = require('./modals');

function registrarSistemaBau(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isButton() && interaction.customId.startsWith('bau_')) {
        return await handleButton(interaction, client);
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('bau_')) {
        return await handleSelectMenu(interaction);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('bau_')) {
        return await handleModalSubmit(interaction, client);
      }
    } catch (erro) {
      console.error('[bau] Erro ao processar interação:', erro);

      const respostaErro = {
        content: '❌ Deu um erro ao processar isso. Tenta de novo, e se continuar avisa o líder.',
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(respostaErro).catch(() => {});
      } else {
        await interaction.reply(respostaErro).catch(() => {});
      }
    }
  });

  console.log('[bau] Sistema de Baú da Facção registrado.');
}

module.exports = { registrarSistemaBau };
