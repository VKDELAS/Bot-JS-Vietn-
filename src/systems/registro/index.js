// ============================================================
// systems/registro/index.js
// Ponto de entrada do sistema de registro.
// ============================================================

const { Events } = require('discord.js');
const { handleButton } = require('./botoes');
const { handleModalSubmit } = require('./modals');

/**
 * Registra o listener de interações do sistema de registro.
 * Chame registrarSistemaRegistro(client) no ready do bot.
 * @param {import('discord.js').Client} client
 */
function registrarSistemaRegistro(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isButton()) {
        // 1. Botão do painel fixo para abrir o modal de registro
        if (interaction.customId === 'registro_abrir') {
          const { construirModalRegistro } = require('./modals');
          return await interaction.showModal(construirModalRegistro());
        }

        // 2. Botões de aprovação/reprovação de registro
        if (
          interaction.customId.startsWith('registro_aprovar__') ||
          interaction.customId.startsWith('registro_reprovar__')
        ) {
          return await handleButton(interaction, client);
        }
      }

      // 3. Recebimento do formulário enviado pelo modal
      if (interaction.isModalSubmit() && interaction.customId === 'registro_modal') {
        return await handleModalSubmit(interaction, client);
      }
    } catch (erro) {
      console.error('[registro] Erro ao processar interação:', erro);

      const respostaErro = {
        content: '❌ Ocorreu um erro no sistema de registro. Reporte à liderança.',
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(respostaErro).catch(() => {});
      } else {
        await interaction.reply(respostaErro).catch(() => {});
      }
    }
  });

  console.log('[registro] Sistema de Registro da Facção registrado.');
}

module.exports = { registrarSistemaRegistro };
