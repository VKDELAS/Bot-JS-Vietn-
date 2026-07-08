// ============================================================
// systems/bau/estoque.js
// Visualização de estoque e itens em falta.
// ============================================================

const queries = require('../../database/queries');
const { formatarLinhaItem } = require('../../utils/formatarLinha');
const { ehLider, negarPermissao } = require('../../utils/permissoes');

function agruparPorCategoria(itens) {
  const grupos = new Map();
  for (const item of itens) {
    if (!grupos.has(item.categoria_nome)) {
      grupos.set(item.categoria_nome, { emoji: item.categoria_emoji, itens: [] });
    }
    grupos.get(item.categoria_nome).itens.push(item);
  }
  return grupos;
}

function montarTextoEstoque(itens, tituloVazio) {
  if (itens.length === 0) return tituloVazio;

  const grupos = agruparPorCategoria(itens);
  const blocos = [];

  for (const [nomeCategoria, dados] of grupos) {
    const linhas = dados.itens.map((item) =>
      formatarLinhaItem(item.emoji, item.nome, item.quantidade)
    );
    blocos.push(`**${dados.emoji} ${nomeCategoria}**\n${linhas.map((l) => ` - ${l}`).join('\n')}`);
  }

  return blocos.join('\n\n');
}

async function handleVerEstoque(interaction) {
  const itens = queries.listarItensPorCategoria();
  const texto = montarTextoEstoque(itens, '📭 O baú está vazio no momento.');

  await interaction.reply({
    content: `## 📊 Estoque do Baú\n\n${texto}`,
    ephemeral: true,
  });
}

async function handleItensEmFalta(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction, 'Só o líder pode ver os itens em falta.');
  }

  const itens = queries.listarItensEmFalta();
  const texto = montarTextoEstoque(itens, '✅ Nenhum item abaixo do mínimo no momento.');

  await interaction.reply({
    content: `## ⚠️ Itens em Falta\n\n${texto}`,
    ephemeral: true,
  });
}

module.exports = { handleVerEstoque, handleItensEmFalta, montarTextoEstoque };
