// ============================================================
// events/guildMemberAdd.js
// Disparado quando um novo membro entra no servidor (Boas-vindas).
// ============================================================

const { Events } = require('discord.js');
const { enviarMensagemEntrada } = require('../systems/boasvindas/mensagens');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    await enviarMensagemEntrada(member);
  },
};
