// ============================================================
// systems/bau/botoes.js
// Roteador de cliques de botão do baú.
// ============================================================

const queries = require('../../database/queries');
const { ehMembroDaFaccao, negarPermissao } = require('../../utils/permissoes');
const { construirSelectCategorias, construirSelectItens } = require('./selects');
const { handleVerEstoque, handleItensEmFalta } = require('./estoque');
const { handleMeuHistorico, handleLogGeral } = require('./historico');
const gerenciar = require('./gerenciar');

async function handleGuardarInicio(interaction) {
  if (!ehMembroDaFaccao(interaction.member)) {
    return negarPermissao(interaction, 'Só membros registrados da facção podem guardar itens.');
  }

  const categorias = queries.listarCategorias();
  if (categorias.length === 0) {
    return interaction.reply({
      content: '❌ Nenhuma categoria cadastrada ainda. Peça pro líder criar uma em Gerenciar Baú.',
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: '📥 Escolha a categoria do item que você vai guardar:',
    components: [construirSelectCategorias('guardar')],
    ephemeral: true,
  });
}

async function handleRetirarInicio(interaction) {
  if (!ehMembroDaFaccao(interaction.member)) {
    return negarPermissao(interaction, 'Só membros registrados da facção podem retirar itens.');
  }

  const itens = queries.listarItensDisponiveis();
  if (itens.length === 0) {
    return interaction.reply({ content: '📭 O baú está vazio no momento.', ephemeral: true });
  }

  await interaction.reply({
    content: '📤 Escolha o item que você vai retirar:',
    components: [construirSelectItens('retirar', itens)],
    ephemeral: true,
  });
}

/**
 * Router principal chamado pelo index.js pra qualquer ButtonInteraction
 * cujo customId comece com "bau_".
 */
async function handleButton(interaction, client) {
  switch (interaction.customId) {
    // --- Painel principal ---
    case 'bau_guardar':
      return handleGuardarInicio(interaction);
    case 'bau_retirar':
      return handleRetirarInicio(interaction);
    case 'bau_ver_estoque':
      return handleVerEstoque(interaction);
    case 'bau_meu_historico':
      return handleMeuHistorico(interaction);
    case 'bau_log_geral':
      return handleLogGeral(interaction);
    case 'bau_itens_falta':
      return handleItensEmFalta(interaction);
    case 'bau_gerenciar':
      return gerenciar.handleAbrirSubmenu(interaction);

    // --- Submenu Gerenciar Baú ---
    case 'bau_ger_criar_item':
      return gerenciar.handleCriarItemInicio(interaction);
    case 'bau_ger_add_categoria':
      return gerenciar.handleAdicionarCategoriaInicio(interaction);
    case 'bau_ger_retirar_categoria':
      return gerenciar.handleRetirarCategoriaInicio(interaction);
    case 'bau_ger_excluir_item':
      return gerenciar.handleExcluirItemInicio(interaction);
    case 'bau_ger_resetar_item':
      return gerenciar.handleResetarItemInicio(interaction);
    case 'bau_ger_editar_qtd':
      return gerenciar.handleEditarQuantidadeInicio(interaction);
    case 'bau_cancelar':
      return gerenciar.handleCancelar(interaction);

    default:
      if (interaction.customId.startsWith('bau_confirmar_reset__')) {
        const itemId = interaction.customId.split('__')[1];
        return gerenciar.handleConfirmarReset(interaction, itemId, client);
      }
      if (interaction.customId.startsWith('bau_confirmar_excluir__')) {
        const itemId = interaction.customId.split('__')[1];
        return gerenciar.handleConfirmarExcluirItem(interaction, itemId, client);
      }
  }
}

module.exports = { handleButton };
