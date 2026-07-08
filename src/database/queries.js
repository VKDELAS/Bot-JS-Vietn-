// ============================================================
// database/queries.js
// Todas as queries do sistema do baú, isoladas num só lugar.
// ============================================================

const db = require('./bau');

module.exports = {
  // ---------- Categorias ----------
  listarCategorias() {
    return db.prepare('SELECT * FROM bau_categorias ORDER BY nome').all();
  },

  buscarCategoriaPorId(id) {
    return db.prepare('SELECT * FROM bau_categorias WHERE id = ?').get(id);
  },

  criarCategoria(nome, emoji) {
    return db
      .prepare('INSERT INTO bau_categorias (nome, emoji) VALUES (?, ?)')
      .run(nome, emoji);
  },

  // ---------- Itens ----------
  buscarItemPorNomeExato(nome) {
    return db.prepare('SELECT * FROM bau_itens WHERE nome = ? COLLATE NOCASE').get(nome);
  },

  buscarItemPorId(id) {
    return db.prepare('SELECT * FROM bau_itens WHERE id = ?').get(id);
  },

  listarItensDisponiveis() {
    // Só itens com estoque > 0 — usado no Select Menu de Retirar Item.
    return db
      .prepare('SELECT * FROM bau_itens WHERE quantidade > 0 ORDER BY nome')
      .all();
  },

  listarTodosItens() {
    // Usado em Resetar Item / Editar Quantidade Manual (líder).
    return db.prepare('SELECT * FROM bau_itens ORDER BY nome').all();
  },

  listarItensPorCategoria() {
    return db
      .prepare(
        `SELECT c.nome AS categoria_nome, c.emoji AS categoria_emoji, i.*
         FROM bau_itens i
         JOIN bau_categorias c ON c.id = i.categoria_id
         ORDER BY c.nome, i.nome`
      )
      .all();
  },

  listarItensEmFalta() {
    return db
      .prepare(
        `SELECT c.nome AS categoria_nome, c.emoji AS categoria_emoji, i.*
         FROM bau_itens i
         JOIN bau_categorias c ON c.id = i.categoria_id
         WHERE i.quantidade <= i.quantidade_minima
         ORDER BY c.nome, i.nome`
      )
      .all();
  },

  criarItem({ categoriaId, nome, emoji, quantidade, quantidadeMinima }) {
    const agora = new Date().toISOString();
    return db
      .prepare(
        `INSERT INTO bau_itens
           (categoria_id, nome, emoji, quantidade, quantidade_minima, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        categoriaId,
        nome,
        emoji || '📦',
        quantidade || 0,
        quantidadeMinima || 5,
        agora,
        agora
      );
  },

  ajustarQuantidade(itemId, delta) {
    const agora = new Date().toISOString();
    db.prepare(
      'UPDATE bau_itens SET quantidade = quantidade + ?, atualizado_em = ? WHERE id = ?'
    ).run(delta, agora, itemId);
  },

  definirQuantidade(itemId, novaQuantidade) {
    const agora = new Date().toISOString();
    db.prepare(
      'UPDATE bau_itens SET quantidade = ?, atualizado_em = ? WHERE id = ?'
    ).run(novaQuantidade, agora, itemId);
  },

  // ---------- Movimentações ----------
  registrarMovimentacao({ itemId, usuarioId, usuarioTag, tipo, quantidade }) {
    const agora = new Date().toISOString();
    db.prepare(
      `INSERT INTO bau_movimentacoes (item_id, usuario_id, usuario_tag, tipo, quantidade, data)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(itemId, usuarioId, usuarioTag, tipo, quantidade, agora);
  },

  historicoDoUsuario(usuarioId, limite = 15) {
    return db
      .prepare(
        `SELECT m.*, i.nome AS item_nome, i.emoji AS item_emoji
         FROM bau_movimentacoes m
         JOIN bau_itens i ON i.id = m.item_id
         WHERE m.usuario_id = ?
         ORDER BY m.data DESC
         LIMIT ?`
      )
      .all(usuarioId, limite);
  },

  historicoGeral(limite = 15, offset = 0) {
    return db
      .prepare(
        `SELECT m.*, i.nome AS item_nome, i.emoji AS item_emoji
         FROM bau_movimentacoes m
         JOIN bau_itens i ON i.id = m.item_id
         ORDER BY m.data DESC
         LIMIT ? OFFSET ?`
      )
      .all(limite, offset);
  },

  contarMovimentacoes() {
    return db.prepare('SELECT COUNT(*) AS total FROM bau_movimentacoes').get().total;
  },

  // ---------- Estatísticas do painel ----------
  totalItensEmEstoque() {
    return db.prepare('SELECT COALESCE(SUM(quantidade), 0) AS total FROM bau_itens').get().total;
  },

  membrosAtivos(dias) {
    return db
      .prepare(
        `SELECT COUNT(DISTINCT usuario_id) AS total
         FROM bau_movimentacoes
         WHERE datetime(data) >= datetime('now', ?)`
      )
      .get(`-${dias} days`).total;
  },

  existeItemEmFalta() {
    return (
      db
        .prepare('SELECT COUNT(*) AS total FROM bau_itens WHERE quantidade <= quantidade_minima')
        .get().total > 0
    );
  },

  // ---------- Painel fixo (persistência do message_id) ----------
  salvarPainel(channelId, messageId) {
    db.prepare(
      `INSERT INTO bau_painel (id, channel_id, message_id) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET channel_id = excluded.channel_id, message_id = excluded.message_id`
    ).run(channelId, messageId);
  },

  buscarPainel() {
    return db.prepare('SELECT * FROM bau_painel WHERE id = 1').get();
  },
};
