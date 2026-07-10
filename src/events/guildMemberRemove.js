// ============================================================
// events/guildMemberRemove.js
// Disparado quando um membro deixa o servidor (Saída).
// ============================================================

const { Events } = require('discord.js');
const { enviarMensagemSaida } = require('../systems/boasvindas/mensagens');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    await enviarMensagemSaida(member);
  },
};
