// ============================================================
// src/utils/permissoes.js
// Checagens de permissão integradas do Baú e do Registro.
// ============================================================

const fs = require('fs');
const path = require('path');
const { CARGOS_LIDERES, ROLES } = require('../config/settings');

/**
 * Verifica se o membro tem cargos de Líder (01 ou 02)
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function ehLider(member) {
  if (!member) return false;
  return CARGOS_LIDERES.some((id) => member.roles.cache.has(id));
}

/**
 * Verifica se o membro é registrado na facção:
 * 1. Se é líder (01 ou 02)
 * 2. Se tem o cargo de Membro no Discord
 * 3. Se possui um arquivo de registro aprovado na pasta de registros
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function ehMembroDaFaccao(member) {
  if (!member) return false;

  // 1. Líderes sempre têm acesso
  if (ehLider(member)) return true;

  // 2. Se tem o cargo MEMBRO no Discord
  if (member.roles.cache.has(ROLES.MEMBRO)) return true;

  // 3. Verifica se tem registro local aprovado
  const registroPath = path.join(process.cwd(), 'registros', `${member.id}.json`);
  if (fs.existsSync(registroPath)) {
    try {
      const dados = JSON.parse(fs.readFileSync(registroPath, 'utf8'));
      if (dados.status === 'aprovado') {
        return true;
      }
    } catch (erro) {
      console.error(`[permissoes] Erro ao ler arquivo de registro para ${member.id}:`, erro.message);
    }
  }

  return false;
}

/**
 * Responde de forma efêmera negando a ação por falta de permissão
 */
async function negarPermissao(interaction, motivo = 'Você não tem permissão para usar essa ação.') {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp({ content: `🚫 ${motivo}`, ephemeral: true }).catch(() => {});
  } else {
    await interaction.reply({ content: `🚫 ${motivo}`, ephemeral: true }).catch(() => {});
  }
}

module.exports = { ehLider, ehMembroDaFaccao, negarPermissao };
