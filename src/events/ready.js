// ============================================================
// events/ready.js
// Evento Ready: Inicializa os sistemas e sincroniza os comandos.
// ============================================================

const { Events } = require('discord.js');
const { registrarSistemaBau } = require('../systems/bau');
const { registrarSistemaRegistro } = require('../systems/registro');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`🤖 Bot conectado como ${client.user.tag}!`);

    // 1. Registra os sistemas persistentes de botões/selects/modals
    registrarSistemaBau(client);
    registrarSistemaRegistro(client);

    // 2. Registra e sincroniza os comandos slash globais no Discord
    try {
      console.log('[commands] Sincronizando comandos slash...');
      const commandData = Array.from(client.commands.values()).map((cmd) => cmd.data.toJSON());
      await client.application.commands.set(commandData);
      console.log(`[commands] ${commandData.length} comando(s) slash registrado(s) com sucesso.`);
    } catch (erro) {
      console.error('[commands] Erro ao sincronizar comandos slash:', erro.message);
    }
  },
};
