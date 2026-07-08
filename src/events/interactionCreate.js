// ============================================================
// events/interactionCreate.js
// Trata interações de Comandos Slash (Chat Input Commands).
// ============================================================

const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (erro) {
      console.error(`[commands] Erro ao executar /${interaction.commandName}:`, erro);

      const respostaErro = {
        content: '❌ Ocorreu um erro interno ao executar este comando.',
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(respostaErro).catch(() => {});
      } else {
        await interaction.reply(respostaErro).catch(() => {});
      }
    }
  },
};
