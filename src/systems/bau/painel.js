// ============================================================
// systems/bau/painel.js
// Monta o Container (Components V2) do painel fixo e cuida de
// postar/editar a mensagem — nunca reposta, só edita a existente.
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const queries = require('../../database/queries');
const {
  BAU_PANEL_CHANNEL_ID,
  DIAS_MEMBRO_ATIVO,
  COR_PAINEL_OK,
  COR_PAINEL_ALERTA,
  IMAGEM_FACCAO_URL,
} = require('../../config/settings');

// --- Botões do painel ---
function montarActionRows() {
  const linha1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bau_guardar')
      .setLabel('Guardar Item')
      .setEmoji('📥')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('bau_retirar')
      .setLabel('Retirar Item')
      .setEmoji('📤')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('bau_ver_estoque')
      .setLabel('Ver Estoque')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary)
  );

  const linha2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bau_meu_historico')
      .setLabel('Meu Histórico')
      .setEmoji('📜')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('bau_log_geral')
      .setLabel('Log Geral')
      .setEmoji('🕵️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('bau_itens_falta')
      .setLabel('Itens em Falta')
      .setEmoji('⚠️')
      .setStyle(ButtonStyle.Secondary)
  );

  const linha3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bau_gerenciar')
      .setLabel('Gerenciar Baú')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary)
  );

  return [linha1, linha2, linha3];
}

const { SeparatorSpacingSize } = require('discord.js');

function montarContainerPainel() {
  const totalItens = queries.totalItensEmEstoque();
  const membrosAtivos = queries.membrosAtivos(DIAS_MEMBRO_ATIVO);
  const temItemEmFalta = queries.existeItemEmFalta();
  const itensPorCategoria = queries.listarItensPorCategoria();

  const container = new ContainerBuilder().setAccentColor(
    temItemEmFalta ? COR_PAINEL_ALERTA : COR_PAINEL_OK
  );

  // --- Título ---
  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## 🏴 BAÚ DA FACÇÃO')
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  // --- Itens agrupados por categoria ---
  if (itensPorCategoria.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('*Nenhum item cadastrado no baú ainda.*')
    );
  } else {
    // Agrupar por categoria
    const grupos = {};
    for (const item of itensPorCategoria) {
      const chave = item.categoria_nome;
      if (!grupos[chave]) {
        grupos[chave] = { emoji: item.categoria_emoji, itens: [] };
      }
      grupos[chave].itens.push(item);
    }

    const linhas = [];
    for (const [nomeCategoria, grupo] of Object.entries(grupos)) {
      linhas.push(`**${grupo.emoji} ${nomeCategoria}**`);
      for (const item of grupo.itens) {
        const falta = item.quantidade <= item.quantidade_minima;
        const indicador = falta ? '🔴' : '🟢';
        linhas.push(`${indicador} ${item.emoji} ${item.nome} — **${item.quantidade}**`);
      }
      linhas.push('');
    }

    // Remove última linha em branco
    if (linhas[linhas.length - 1] === '') linhas.pop();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(linhas.join('\n'))
    );
  }

  container.addSeparatorComponents(new SeparatorBuilder());

  // --- Stats ---
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `📦 Itens no estoque: **${totalItens}** | 👥 Membros ativos: **${membrosAtivos}**`
    )
  );

  container.addSeparatorComponents(new SeparatorBuilder());

  for (const linha of montarActionRows()) {
    container.addActionRowComponents(linha);
  }

  return container;
}


/**
 * Envia o painel pela primeira vez no canal fixo configurado.
 */
async function enviarPainel(client) {
  const canal = await client.channels.fetch(BAU_PANEL_CHANNEL_ID);
  const container = montarContainerPainel();

  const mensagem = await canal.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  queries.salvarPainel(canal.id, mensagem.id);
  return mensagem;
}

/**
 * Reedita o painel existente (chamado depois de toda movimentação).
 */
async function atualizarPainel(client) {
  const registro = queries.buscarPainel();
  if (!registro || !registro.message_id) {
    return null;
  }

  try {
    const canal = await client.channels.fetch(registro.channel_id);
    const mensagem = await canal.messages.fetch(registro.message_id);
    const container = montarContainerPainel();

    return await mensagem.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (erro) {
    console.error('[bau] Painel salvo não encontrado, reenviando um novo:', erro.message);
    return enviarPainel(client);
  }
}

module.exports = { enviarPainel, atualizarPainel, montarContainerPainel };
