// ============================================================
// commands/setup.js
// Posta ou atualiza os painéis fixos (Baú + Registro).
//
// Lógica de versão:
//   - Cada painel tem uma version salva no banco.
//   - Se a version no banco == SETUP_VERSION → painel está atualizado.
//     Só verifica se a mensagem ainda existe; se sim, não faz nada.
//   - Se a version for diferente (ou não existir) → apaga o antigo e envia novo.
//   - Para forçar reenvio: bumpar SETUP_VERSION em config/settings.js.
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const { ehLider } = require('../utils/permissoes');
const { montarContainerPainel } = require('../systems/bau/painel');
const { construirContainerRegistro } = require('../systems/registro/painel');
const queries = require('../database/queries');
const { BAU_PANEL_CHANNEL_ID, REGISTRO_CHANNEL_ID, SETUP_VERSION } = require('../config/settings');

/**
 * Tenta buscar uma mensagem existente. Retorna null se não encontrar.
 */
async function buscarMensagem(client, channelId, messageId) {
  try {
    const canal = await client.channels.fetch(channelId);
    return await canal.messages.fetch(messageId);
  } catch {
    return null;
  }
}

/**
 * Apaga a mensagem antiga e envia o novo painel no canal.
 * Retorna a nova mensagem.
 */
async function substituirPainel(client, channelId, mensagemAntiga, container) {
  // Tenta apagar o antigo — falha silenciosa se já foi deletado
  if (mensagemAntiga) {
    try {
      await mensagemAntiga.delete();
    } catch (e) {
      console.warn('[setup] Não foi possível apagar painel antigo:', e.message);
    }
  }

  const canal = await client.channels.fetch(channelId);
  return canal.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Posta ou atualiza os painéis fixos do Baú e do Registro.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!ehLider(interaction.member)) {
      return interaction.reply({
        content: '🚫 Apenas a liderança (01/02) pode usar este comando.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const client = interaction.client;
    const linhas = [];

    // ─── Painel do Baú ─────────────────────────────────────────
    try {
      const registroBau = queries.buscarPainel();
      const versaoOkBau = registroBau?.version === SETUP_VERSION;

      if (versaoOkBau) {
        // Versão correta — verifica só se a mensagem ainda existe
        const msg = await buscarMensagem(client, registroBau.channel_id, registroBau.message_id);
        if (msg) {
          linhas.push(`📦 Baú: ✓ Sem alterações — [ver](${msg.url})`);
        } else {
          // Mensagem foi deletada externamente → reenvía
          const nova = await substituirPainel(client, BAU_PANEL_CHANNEL_ID, null, montarContainerPainel());
          queries.salvarPainel(nova.channelId, nova.id, SETUP_VERSION);
          linhas.push(`📦 Baú: ✅ Reenviado (mensagem anterior deletada) — [ver](${nova.url})`);
        }
      } else {
        // Versão desatualizada ou não existe → apaga e envia novo
        const msgAntiga = registroBau?.message_id
          ? await buscarMensagem(client, registroBau.channel_id, registroBau.message_id)
          : null;

        const nova = await substituirPainel(client, BAU_PANEL_CHANNEL_ID, msgAntiga, montarContainerPainel());
        queries.salvarPainel(nova.channelId, nova.id, SETUP_VERSION);
        linhas.push(`📦 Baú: 🔄 ${registroBau ? 'Atualizado' : 'Enviado'} — [ver](${nova.url})`);
      }
    } catch (e) {
      console.error('[setup] Erro no painel do baú:', e);
      linhas.push(`📦 Baú: ❌ Erro — ${e.message}`);
    }

    // ─── Painel de Registro ────────────────────────────────────
    try {
      const registroReg = queries.buscarPainelRegistro();
      const versaoOkReg = registroReg?.version === SETUP_VERSION;

      if (versaoOkReg) {
        const msg = await buscarMensagem(client, registroReg.channel_id, registroReg.message_id);
        if (msg) {
          linhas.push(`📋 Registro: ✓ Sem alterações — [ver](${msg.url})`);
        } else {
          const nova = await substituirPainel(client, REGISTRO_CHANNEL_ID, null, construirContainerRegistro());
          queries.salvarPainelRegistro(nova.channelId, nova.id, SETUP_VERSION);
          linhas.push(`📋 Registro: ✅ Reenviado (mensagem anterior deletada) — [ver](${nova.url})`);
        }
      } else {
        const msgAntiga = registroReg?.message_id
          ? await buscarMensagem(client, registroReg.channel_id, registroReg.message_id)
          : null;

        const nova = await substituirPainel(client, REGISTRO_CHANNEL_ID, msgAntiga, construirContainerRegistro());
        queries.salvarPainelRegistro(nova.channelId, nova.id, SETUP_VERSION);
        linhas.push(`📋 Registro: 🔄 ${registroReg ? 'Atualizado' : 'Enviado'} — [ver](${nova.url})`);
      }
    } catch (e) {
      console.error('[setup] Erro no painel de registro:', e);
      linhas.push(`📋 Registro: ❌ Erro — ${e.message}`);
    }

    await interaction.editReply({ content: linhas.join('\n') });
  },
};
