// ============================================================
// systems/bau/modals.js
// Trata submissão de modais do baú.
// ============================================================

const queries = require('../../database/queries');
const { atualizarPainel } = require('./painel');
const { logarMovimentacao } = require('./log');

function paraInteiro(valorTexto, valorPadrao = null) {
  const numero = parseInt(String(valorTexto).replace(/\D/g, ''), 10);
  return Number.isNaN(numero) ? valorPadrao : numero;
}

async function handleModalSubmit(interaction, client) {
  const [tipo, contexto] = interaction.customId.split('__');

  // ---------- Guardar Item ----------
  if (tipo === 'bau_modal_guardar') {
    const categoriaId = contexto;
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const quantidade = paraInteiro(interaction.fields.getTextInputValue('quantidade'));

    if (!quantidade || quantidade <= 0) {
      return interaction.reply({ content: '❌ Quantidade inválida.', ephemeral: true });
    }

    let item = queries.buscarItemPorNomeExato(nome);

    if (item) {
      queries.ajustarQuantidade(item.id, quantidade);
    } else {
      const categoria = queries.buscarCategoriaPorId(categoriaId);
      queries.criarItem({
        categoriaId,
        nome,
        emoji: categoria ? categoria.emoji : '📦',
        quantidade,
        quantidadeMinima: 5,
      });
      item = queries.buscarItemPorNomeExato(nome);
    }

    queries.registrarMovimentacao({
      itemId: item.id,
      usuarioId: interaction.user.id,
      usuarioTag: interaction.user.tag,
      tipo: 'entrada',
      quantidade,
    });

    await interaction.reply({
      content: `📥 Você guardou **${quantidade}x ${item.emoji} ${item.nome}** no baú.`,
      ephemeral: true,
    });

    await atualizarPainel(client);
    await logarMovimentacao(client, {
      usuarioTag: interaction.user.tag,
      tipo: 'entrada',
      quantidade,
      itemNome: item.nome,
      itemEmoji: item.emoji,
    });
    return;
  }

  // ---------- Retirar Item ----------
  if (tipo === 'bau_modal_retirar') {
    const itemId = contexto;
    const item = queries.buscarItemPorId(itemId);
    const quantidade = paraInteiro(interaction.fields.getTextInputValue('quantidade'));

    if (!item) {
      return interaction.reply({ content: '❌ Esse item não existe mais.', ephemeral: true });
    }
    if (!quantidade || quantidade <= 0) {
      return interaction.reply({ content: '❌ Quantidade inválida.', ephemeral: true });
    }
    if (quantidade > item.quantidade) {
      return interaction.reply({
        content: `❌ Só tem ${item.quantidade}x ${item.nome} disponível no baú.`,
        ephemeral: true,
      });
    }

    queries.ajustarQuantidade(item.id, -quantidade);
    queries.registrarMovimentacao({
      itemId: item.id,
      usuarioId: interaction.user.id,
      usuarioTag: interaction.user.tag,
      tipo: 'saida',
      quantidade,
    });

    await interaction.reply({
      content: `📤 Você retirou **${quantidade}x ${item.emoji} ${item.nome}** do baú.`,
      ephemeral: true,
    });

    await atualizarPainel(client);
    await logarMovimentacao(client, {
      usuarioTag: interaction.user.tag,
      tipo: 'saida',
      quantidade,
      itemNome: item.nome,
      itemEmoji: item.emoji,
    });
    return;
  }

  // ---------- Gerenciar Baú: Criar Item ----------
  if (tipo === 'bau_modal_criar_item') {
    const categoriaId = contexto;
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const emoji = interaction.fields.getTextInputValue('emoji')?.trim() || '📦';
    const quantidadeInicial = paraInteiro(interaction.fields.getTextInputValue('quantidade_inicial'), 0);
    const quantidadeMinima = paraInteiro(interaction.fields.getTextInputValue('quantidade_minima'), 5);

    if (queries.buscarItemPorNomeExato(nome)) {
      return interaction.reply({
        content: `❌ Já existe um item chamado **${nome}** no catálogo.`,
        ephemeral: true,
      });
    }

    queries.criarItem({
      categoriaId,
      nome,
      emoji,
      quantidade: quantidadeInicial,
      quantidadeMinima,
    });

    await interaction.reply({
      content: `✅ Item **${emoji} ${nome}** criado no catálogo (estoque inicial: ${quantidadeInicial}).`,
      ephemeral: true,
    });

    await atualizarPainel(client);
    return;
  }

  // ---------- Gerenciar Baú: Adicionar Categoria ----------
  if (tipo === 'bau_modal_add_categoria') {
    const nome = interaction.fields.getTextInputValue('nome').trim();
    const emoji = interaction.fields.getTextInputValue('emoji').trim() || '📦';

    const jaExiste = queries.buscarCategoriaPorNome(nome);
    if (jaExiste) {
      return interaction.reply({
        content: `❌ Já existe uma categoria chamada **${jaExiste.emoji} ${jaExiste.nome}**.`,
        ephemeral: true,
      });
    }

    queries.criarCategoria(nome, emoji);
    return interaction.reply({
      content: `✅ Categoria **${emoji} ${nome}** criada com sucesso.`,
      ephemeral: true,
    });
  }

  // ---------- Gerenciar Baú: Editar Quantidade Manual ----------
  if (tipo === 'bau_modal_editar_qtd') {
    const itemId = contexto;
    const item = queries.buscarItemPorId(itemId);
    const novaQuantidade = paraInteiro(interaction.fields.getTextInputValue('quantidade'));

    if (!item) {
      return interaction.reply({ content: '❌ Esse item não existe mais.', ephemeral: true });
    }
    if (novaQuantidade === null || novaQuantidade < 0) {
      return interaction.reply({ content: '❌ Quantidade inválida.', ephemeral: true });
    }

    const diferenca = novaQuantidade - item.quantidade;
    queries.definirQuantidade(item.id, novaQuantidade);
    queries.registrarMovimentacao({
      itemId: item.id,
      usuarioId: interaction.user.id,
      usuarioTag: interaction.user.tag,
      tipo: 'ajuste_manual',
      quantidade: diferenca,
    });

    await interaction.reply({
      content: `✏️ Quantidade de **${item.emoji} ${item.nome}** ajustada de ${item.quantidade} para ${novaQuantidade}.`,
      ephemeral: true,
    });

    await atualizarPainel(client);
    await logarMovimentacao(client, {
      usuarioTag: interaction.user.tag,
      tipo: 'ajuste_manual',
      quantidade: Math.abs(diferenca),
      itemNome: item.nome,
      itemEmoji: item.emoji,
    });
    return;
  }
}

module.exports = { handleModalSubmit };
