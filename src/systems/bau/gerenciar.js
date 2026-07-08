// ============================================================
// systems/bau/gerenciar.js
// Lógica de gerência de itens/estoque do baú.
// ============================================================

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const queries = require('../../database/queries');
const { ehLider, negarPermissao } = require('../../utils/permissoes');
const { atualizarPainel } = require('./painel');
const { construirSelectCategorias, construirSelectItens } = require('./selects');
const { logarMovimentacao } = require('./log');

function modalAdicionarCategoria() {
  return new ModalBuilder()
    .setCustomId('bau_modal_add_categoria')
    .setTitle('Adicionar Categoria')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome')
          .setLabel('Nome da categoria')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('emoji')
          .setLabel('Emoji da categoria')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 🧪')
          .setRequired(true)
      )
    );
}

async function handleAbrirSubmenu(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction, 'Só o líder pode gerenciar o baú.');
  }

  const linha = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('bau_ger_criar_item')
      .setLabel('Criar Item')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('bau_ger_add_categoria')
      .setLabel('Adicionar Categoria')
      .setEmoji('🗂️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('bau_ger_retirar_categoria')
      .setLabel('Retirar Categoria')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('bau_ger_resetar_item')
      .setLabel('Resetar Item')
      .setEmoji('🔁')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('bau_ger_editar_qtd')
      .setLabel('Editar Quantidade Manual')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: '⚙️ **Gerenciar Baú** — escolha uma ação:',
    components: [linha],
    ephemeral: true,
  });
}

async function handleCriarItemInicio(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const categorias = queries.listarCategorias();
  if (categorias.length === 0) {
    return interaction.reply({
      content: '❌ Nenhuma categoria cadastrada ainda. Crie uma categoria primeiro.',
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: '➕ Escolha a categoria do novo item:',
    components: [construirSelectCategorias('criar')],
    ephemeral: true,
  });
}

async function handleAdicionarCategoriaInicio(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }
  await interaction.showModal(modalAdicionarCategoria());
}

async function handleResetarItemInicio(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const itens = queries.listarTodosItens();
  if (itens.length === 0) {
    return interaction.reply({ content: '❌ Não existe nenhum item cadastrado.', ephemeral: true });
  }

  await interaction.reply({
    content: '🔁 Escolha o item que quer zerar:',
    components: [construirSelectItens('resetar', itens)],
    ephemeral: true,
  });
}

async function handleEditarQuantidadeInicio(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const itens = queries.listarTodosItens();
  if (itens.length === 0) {
    return interaction.reply({ content: '❌ Não existe nenhum item cadastrado.', ephemeral: true });
  }

  await interaction.reply({
    content: '✏️ Escolha o item que quer ajustar:',
    components: [construirSelectItens('editar', itens)],
    ephemeral: true,
  });
}

async function handleConfirmarReset(interaction, itemId, client) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const item = queries.buscarItemPorId(itemId);
  if (!item) {
    return interaction.update({ content: '❌ Esse item não existe mais.', components: [] });
  }

  const quantidadeAnterior = item.quantidade;
  queries.definirQuantidade(item.id, 0);
  queries.registrarMovimentacao({
    itemId: item.id,
    usuarioId: interaction.user.id,
    usuarioTag: interaction.user.tag,
    tipo: 'ajuste_manual',
    quantidade: -quantidadeAnterior,
  });

  await interaction.update({
    content: `🔁 Estoque de **${item.emoji} ${item.nome}** zerado (era ${quantidadeAnterior}).`,
    components: [],
  });

  await atualizarPainel(client);
  if (quantidadeAnterior > 0) {
    await logarMovimentacao(client, {
      usuarioTag: interaction.user.tag,
      usuarioId: interaction.user.id,
      usuarioAvatarURL: interaction.user.displayAvatarURL({ dynamic: true }),
      tipo: 'ajuste_manual',
      quantidade: quantidadeAnterior,
      itemNome: item.nome,
      itemEmoji: item.emoji,
    });
  }
}

async function handleRetirarCategoriaInicio(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const categorias = queries.listarCategorias();
  if (categorias.length === 0) {
    return interaction.reply({ content: '❌ Nenhuma categoria cadastrada.', ephemeral: true });
  }

  const { StringSelectMenuBuilder } = require('discord.js');

  const select = new StringSelectMenuBuilder()
    .setCustomId('bau_ger_sel_deletar_cat')
    .setPlaceholder('Escolha a categoria para remover')
    .addOptions(
      categorias.map((c) => ({
        label: `${c.emoji} ${c.nome}`,
        value: String(c.id),
      }))
    );

  await interaction.reply({
    content: '🗑️ Escolha a categoria que deseja remover:\n> ⚠️ Só é possível remover categorias **sem itens vinculados**.',
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true,
  });
}

async function handleConfirmarDeletarCategoria(interaction, categoriaId) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction);
  }

  const categoria = queries.buscarCategoriaPorId(categoriaId);
  if (!categoria) {
    return interaction.update({ content: '❌ Categoria não encontrada.', components: [] });
  }

  const resultado = queries.deletarCategoria(categoriaId);
  if (resultado.bloqueado) {
    return interaction.update({
      content: `❌ Não é possível remover **${categoria.emoji} ${categoria.nome}** — ela tem ${resultado.total} item(ns) vinculado(s).\nRemova ou mova os itens antes.`,
      components: [],
    });
  }

  await interaction.update({
    content: `✅ Categoria **${categoria.emoji} ${categoria.nome}** removida com sucesso.`,
    components: [],
  });
}

async function handleCancelar(interaction) {
  await interaction.update({ content: '❎ Ação cancelada.', components: [] });
}

module.exports = {
  handleAbrirSubmenu,
  handleCriarItemInicio,
  handleAdicionarCategoriaInicio,
  handleRetirarCategoriaInicio,
  handleConfirmarDeletarCategoria,
  handleResetarItemInicio,
  handleEditarQuantidadeInicio,
  handleConfirmarReset,
  handleCancelar,
};
