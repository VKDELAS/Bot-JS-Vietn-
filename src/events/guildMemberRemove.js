// ============================================================
// events/guildMemberRemove.js
// Disparado quando um membro deixa o servidor (Saída).
// ============================================================

const { Events, EmbedBuilder } = require('discord.js');
const { CORES, FAC_NOME } = require('../config/settings');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    const canal = member.guild.systemChannel;
    if (!canal) return;

    try {
      const embed = new EmbedBuilder()
        .setTitle(`👋 Saiu da Facção ${FAC_NOME}`)
        .setDescription(
          `**${member.displayName}** deixou o servidor.\n\n` +
          `*Uma vez Vietnã, sempre Vietnã. Vai com Deus, soldado.*`
        )
        .setColor(CORES.MUTED)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `${FAC_NOME} • ${member.guild.memberCount} membros` })
        .setTimestamp();

      await canal.send({ embeds: [embed] });
    } catch (erro) {
      console.error('[events/guildMemberRemove] Erro ao enviar mensagem de saída:', erro.message);
    }
  },
};
