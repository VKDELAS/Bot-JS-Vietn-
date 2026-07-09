// ============================================================
// commands/setup.js
// Posta ou atualiza os painéis fixos (Baú + Registro).
//
// Lógica de comparação por conteúdo:
//   - Busca a mensagem já existente no canal (via id salvo no banco).
//   - Monta o container que SERIA enviado agora.
//   - Compara os dois (ignorando os `id` de componente, que o Discord
//     atribui sozinho e nunca vão bater com o container montado local).
//   - Iguais       → não faz nada.
//   - Diferentes   → apaga a antiga e envia a nova.
//   - Não existe   → envia e salva.
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

const { ehLider } = require('../utils/permissoes');
const { montarContainerPainel } = require('../systems/bau/painel');
const { construirContainerRegistro } = require('../systems/registro/painel');
const queries = require('../database/queries');
const { BAU_PANEL_CHANNEL_ID, REGISTRO_CHANNEL_ID } = require('../config/settings');

/**
 * Tenta buscar uma mensagem existente. Retorna null se não encontrar.
 */
async function buscarMensagem(client, channelId, messageId) {
  if (!channelId || !messageId) return null;
  try {
    const canal = await client.channels.fetch(channelId);
    return await canal.messages.fetch(messageId);
  } catch {
    return null;
  }
}

/**
 * Remove recursivamente a chave `id` de um objeto/array.
 * Necessário porque o Discord atribui um `id` numérico a cada componente
 * assim que a mensagem é enviada — esse campo nunca existe no container
 * que a gente monta localmente, então precisa ser ignorado na comparação.
 */
function normalizarComponentes(dado) {
  if (Array.isArray(dado)) {
    return dado.map(normalizarComponentes);
  }
  if (dado && typeof dado === 'object') {
    const limpo = {};
    for (const chave of Object.keys(dado)) {
      if (chave === 'id') continue;
      limpo[chave] = normalizarComponentes(dado[chave]);
    }
    return limpo;
  }
  return dado;
}

/**
 * Compara o container de uma mensagem já enviada com o container que seria
 * enviado agora. Retorna true se forem diferentes (ou seja, precisa reenviar).
 */
function painelMudou(mensagemAntiga, containerNovo) {
  // .components de uma mensagem já buscada e o array [containerNovo] passam
  // por toJSON() automaticamente no JSON.stringify/parse.
  const antigo = normalizarComponentes(JSON.parse(JSON.stringify(mensagemAntiga.components)));
  const novo = normalizarComponentes(JSON.parse(JSON.stringify([containerNovo])));
  return JSON.stringify(antigo) !== JSON.stringify(novo);
}

/**
 * Apaga a mensagem antiga (se existir) e envia o novo painel no canal.
 * Retorna a nova mensagem.
 */
async function substituirPainel(client, channelId, mensagemAntiga, container) {
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

/**
 * Processa um painel (busca → compara → decide) e retorna a linha de resumo.
 * @param {import('discord.js').Client} client
 * @param {{
 *   nomeExibicao: string,
 *   emoji: string,
 *   channelId: string,
 *   buscarRegistro: () => any,
 *   salvarRegistro: (channelId: string, messageId: string) => void,
 *   montarContainer: () => any,
 * }} opcoes
 */
async function processarPainel(client, opcoes) {
  const { nomeExibicao, emoji, channelId, buscarRegistro, salvarRegistro, montarContainer } = opcoes;

  try {
    const registro = buscarRegistro();
    const containerNovo = montarContainer();
    const msgAntiga = registro
      ? await buscarMensagem(client, registro.channel_id, registro.message_id)
      : null;

    // Não existe mensagem antiga (nunca postou ou foi deletada externamente) → envia
    if (!msgAntiga) {
      const nova = await substituirPainel(client, channelId, null, containerNovo);
      salvarRegistro(nova.channelId, nova.id);
      const motivo = registro ? 'mensagem anterior deletada' : 'primeira vez';
      return `${emoji} ${nomeExibicao}: ✅ Enviado (${motivo}) — [ver](${nova.url})`;
    }

    // Mensagem existe — compara conteúdo real
    if (!painelMudou(msgAntiga, containerNovo)) {
      return `${emoji} ${nomeExibicao}: ✓ Sem alterações — [ver](${msgAntiga.url})`;
    }

    // Diferente → apaga e reenvia
    const nova = await substituirPainel(client, channelId, msgAntiga, containerNovo);
    salvarRegistro(nova.channelId, nova.id);
    return `${emoji} ${nomeExibicao}: 🔄 Atualizado — [ver](${nova.url})`;
  } catch (e) {
    console.error(`[setup] Erro no painel de ${nomeExibicao}:`, e);
    return `${emoji} ${nomeExibicao}: ❌ Erro — ${e.message}`;
  }
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

    const linhaBau = await processarPainel(client, {
      nomeExibicao: 'Baú',
      emoji: '📦',
      channelId: BAU_PANEL_CHANNEL_ID,
      buscarRegistro: () => queries.buscarPainel(),
      salvarRegistro: (channelId, messageId) => queries.salvarPainel(channelId, messageId),
      montarContainer: () => montarContainerPainel(),
    });

    const linhaRegistro = await processarPainel(client, {
      nomeExibicao: 'Registro',
      emoji: '📋',
      channelId: REGISTRO_CHANNEL_ID,
      buscarRegistro: () => queries.buscarPainelRegistro(),
      salvarRegistro: (channelId, messageId) => queries.salvarPainelRegistro(channelId, messageId),
      montarContainer: () => construirContainerRegistro(),
    });

    await interaction.editReply({ content: [linhaBau, linhaRegistro].join('\n') });
  },
};
