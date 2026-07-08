// ============================================================
// events/guildMemberAdd.js
// Disparado quando um novo membro entra no servidor (Boas-vindas).
// ============================================================

const { Events, EmbedBuilder } = require('discord.js');
const { CORES, FAC_NOME } = require('../config/settings');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    const canal = member.guild.systemChannel;
    if (!canal) return;

    try {
      const embed = new EmbedBuilder()
        .setTitle(`🇻🇳 Bem-vindo à Facção ${FAC_NOME}!`)
        .setDescription(
          `Salve, ${member}! 🎌\n\n` +
          `Você acabou de entrar no servidor oficial da **Facção ${FAC_NOME}**.\n` +
          `Dirija-se ao canal de registro e clique para se registrar e fazer parte da nossa família.\n\n` +
          `*Respeito, lealdade e honra — os pilares do Vietnã.*`
        )
        .setColor(CORES.VIETNA)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${FAC_NOME} • ${member.guild.memberCount} membros` })
        .setTimestamp();

      await canal.send({ embeds: [embed] });
    } catch (erro) {
      console.error('[events/guildMemberAdd] Erro ao enviar boas-vindas:', erro.message);
    }
  },
};
