// ============================================================
// systems/bau/historico.js
// Visualização do histórico pessoal e log geral do baú.
// ============================================================

const queries = require('../../database/queries');
const { formatarDataHora } = require('../../utils/data');
const { ehLider, negarPermissao } = require('../../utils/permissoes');

const TIPO_EMOJI = {
  entrada: '📥',
  saida: '📤',
  ajuste_manual: '✏️',
};

const TIPO_TEXTO = {
  entrada: 'guardou',
  saida: 'retirou',
  ajuste_manual: 'ajustou (manual)',
};

function formatarLinhaMovimentacao(mov) {
  const emoji = TIPO_EMOJI[mov.tipo] || '📦';
  const verbo = TIPO_TEXTO[mov.tipo] || mov.tipo;
  return `${emoji} **${mov.usuario_tag}** ${verbo} ${mov.quantidade}x ${mov.item_emoji} ${mov.item_nome} — ${formatarDataHora(mov.data)}`;
}

async function handleMeuHistorico(interaction) {
  const registros = queries.historicoDoUsuario(interaction.user.id, 15);

  if (registros.length === 0) {
    return interaction.reply({
      content: '📜 Você ainda não tem nenhuma movimentação registrada no baú.',
      ephemeral: true,
    });
  }

  const texto = registros.map(formatarLinhaMovimentacao).join('\n');
  await interaction.reply({
    content: `## 📜 Seu histórico (últimas ${registros.length})\n\n${texto}`,
    ephemeral: true,
  });
}

async function handleLogGeral(interaction) {
  if (!ehLider(interaction.member)) {
    return negarPermissao(interaction, 'Só o líder pode ver o log geral do baú.');
  }

  const total = queries.contarMovimentacoes();
  const registros = queries.historicoGeral(15, 0);

  if (registros.length === 0) {
    return interaction.reply({
      content: '🕵️ Ainda não existe nenhuma movimentação registrada no baú.',
      ephemeral: true,
    });
  }

  const texto = registros.map(formatarLinhaMovimentacao).join('\n');
  const rodape = total > 15 ? `\n\n_Mostrando as 15 mais recentes de ${total} no total._` : '';

  await interaction.reply({
    content: `## 🕵️ Log Geral do Baú\n\n${texto}${rodape}`,
    ephemeral: true,
  });
}

module.exports = { handleMeuHistorico, handleLogGeral, formatarLinhaMovimentacao };
