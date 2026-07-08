// ============================================================
// commands/setup.js
// Comando /setup — posta OU atualiza ambos os painéis fixos
// (Baú + Registro). Só reenvía se o conteúdo mudou.
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const { ehLider } = require('../utils/permissoes');
const { montarContainerPainel, enviarPainel } = require('../systems/bau/painel');
const { construirContainerRegistro } = require('../systems/registro/painel');
const queries = require('../database/queries');
const { BAU_PANEL_CHANNEL_ID, REGISTRO_CHANNEL_ID } = require('../config/settings');

// Serializa um ContainerBuilder pra string comparável
function serializar(container) {
  return JSON.stringify(container.toJSON());
}

// Tenta buscar a mensagem existente de um painel. Retorna null se não existir.
async function buscarMensagem(client, channelId, messageId) {
  try {
    const canal = await client.channels.fetch(channelId);
    return await canal.messages.fetch(messageId);
  } catch {
    return null;
  }
}

// Retorna a string serializada dos components de uma mensagem do Discord
function serializarMensagem(mensagem) {
  return JSON.stringify(mensagem.components.map((c) => c.toJSON()));
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
    const novoContainerBau = montarContainerPainel();
    const novoJsonBau = serializar(novoContainerBau);

    const registroBau = queries.buscarPainel();
    let mensagemBau = registroBau?.message_id
      ? await buscarMensagem(client, registroBau.channel_id, registroBau.message_id)
      : null;

    if (!mensagemBau) {
      // Não existe → envia novo
      const canal = await client.channels.fetch(BAU_PANEL_CHANNEL_ID);
      mensagemBau = await canal.send({
        components: [novoContainerBau],
        flags: MessageFlags.IsComponentsV2,
      });
      queries.salvarPainel(canal.id, mensagemBau.id);
      linhas.push(`📦 Baú: ✅ Painel enviado → [ver](${mensagemBau.url})`);
    } else {
      const jsonAtual = serializarMensagem(mensagemBau);
      if (jsonAtual === novoJsonBau) {
        linhas.push(`📦 Baú: ✓ Sem alterações`);
      } else {
        await mensagemBau.delete().catch(() => {});
        const canal = await client.channels.fetch(BAU_PANEL_CHANNEL_ID);
        const nova = await canal.send({
          components: [novoContainerBau],
          flags: MessageFlags.IsComponentsV2,
        });
        queries.salvarPainel(canal.id, nova.id);
        linhas.push(`📦 Baú: 🔄 Painel atualizado → [ver](${nova.url})`);
      }
    }

    // ─── Painel de Registro ────────────────────────────────────
    const novoContainerReg = construirContainerRegistro();
    const novoJsonReg = serializar(novoContainerReg);

    const registroReg = queries.buscarPainelRegistro();
    let mensagemReg = registroReg?.message_id
      ? await buscarMensagem(client, registroReg.channel_id, registroReg.message_id)
      : null;

    if (!mensagemReg) {
      // Não existe → envia novo
      const canal = await client.channels.fetch(REGISTRO_CHANNEL_ID);
      mensagemReg = await canal.send({
        components: [novoContainerReg],
        flags: MessageFlags.IsComponentsV2,
      });
      queries.salvarPainelRegistro(canal.id, mensagemReg.id);
      linhas.push(`📋 Registro: ✅ Painel enviado → [ver](${mensagemReg.url})`);
    } else {
      const jsonAtual = serializarMensagem(mensagemReg);
      if (jsonAtual === novoJsonReg) {
        linhas.push(`📋 Registro: ✓ Sem alterações`);
      } else {
        await mensagemReg.delete().catch(() => {});
        const canal = await client.channels.fetch(REGISTRO_CHANNEL_ID);
        const nova = await canal.send({
          components: [novoContainerReg],
          flags: MessageFlags.IsComponentsV2,
        });
        queries.salvarPainelRegistro(canal.id, nova.id);
        linhas.push(`📋 Registro: 🔄 Painel atualizado → [ver](${nova.url})`);
      }
    }

    await interaction.editReply({ content: linhas.join('\n') });
  },
};
