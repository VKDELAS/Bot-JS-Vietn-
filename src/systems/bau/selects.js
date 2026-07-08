// ============================================================
// systems/bau/selects.js
// Trata select menus do baú.
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
const { formatarOpcaoDisponivel } = require('../../utils/formatarLinha');

// ---------- Modais reaproveitados ----------
function modalGuardarItem(categoriaId) {
  return new ModalBuilder()
    .setCustomId(`bau_modal_guardar__${categoriaId}`)
    .setTitle('Guardar Item no Baú')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome')
          .setLabel('Nome do item')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: AK-47')
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quantidade')
          .setLabel('Quantidade')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 5')
          .setRequired(true)
      )
    );
}

function modalRetirarItem(itemId) {
  return new ModalBuilder()
    .setCustomId(`bau_modal_retirar__${itemId}`)
    .setTitle('Retirar Item do Baú')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quantidade')
          .setLabel('Quantidade a retirar')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 1')
          .setRequired(true)
      )
    );
}

function modalCriarItem(categoriaId) {
  return new ModalBuilder()
    .setCustomId(`bau_modal_criar_item__${categoriaId}`)
    .setTitle('Criar Novo Item')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('nome')
          .setLabel('Nome do item')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('emoji')
          .setLabel('Emoji do item (opcional)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 🔫')
          .setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quantidade_inicial')
          .setLabel('Quantidade inicial')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('0')
          .setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quantidade_minima')
          .setLabel('Quantidade mínima (alerta de falta)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('5')
          .setRequired(false)
      )
    );
}

function modalEditarQuantidade(itemId, quantidadeAtual) {
  return new ModalBuilder()
    .setCustomId(`bau_modal_editar_qtd__${itemId}`)
    .setTitle('Editar Quantidade Manualmente')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quantidade')
          .setLabel('Nova quantidade')
          .setStyle(TextInputStyle.Short)
          .setValue(String(quantidadeAtual))
          .setRequired(true)
      )
    );
}

// ---------- Router principal ----------
async function handleSelectMenu(interaction) {
  const [, , contexto] = interaction.customId.split('__');
  const tipoSelect = interaction.customId.split('__')[0];

  // --- Select de deletar categoria (gerenciar) ---
  if (interaction.customId === 'bau_ger_sel_deletar_cat') {
    const gerenciar = require('./gerenciar');
    const categoriaId = interaction.values[0];
    return gerenciar.handleConfirmarDeletarCategoria(interaction, categoriaId);
  }

  // --- Selects de categoria ---
  if (tipoSelect === 'bau_cat_sel') {
    const categoriaId = interaction.values[0];

    if (contexto === 'guardar') {
      return interaction.showModal(modalGuardarItem(categoriaId));
    }
    if (contexto === 'criar') {
      return interaction.showModal(modalCriarItem(categoriaId));
    }
  }

  // --- Selects de item ---
  if (tipoSelect === 'bau_item_sel') {
    const itemId = interaction.values[0];
    const item = queries.buscarItemPorId(itemId);

    if (!item) {
      return interaction.reply({ content: '❌ Esse item não existe mais.', ephemeral: true });
    }

    if (contexto === 'retirar') {
      return interaction.showModal(modalRetirarItem(itemId));
    }

    if (contexto === 'editar') {
      return interaction.showModal(modalEditarQuantidade(itemId, item.quantidade));
    }

    if (contexto === 'resetar') {
      const linhaConfirmacao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`bau_confirmar_reset__${itemId}`)
          .setLabel(`Confirmar reset de ${item.nome}`)
          .setEmoji('🔁')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('bau_cancelar')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: `⚠️ Tem certeza que quer zerar o estoque de **${item.emoji} ${item.nome}** (atualmente ${item.quantidade})?`,
        components: [linhaConfirmacao],
        ephemeral: true,
      });
    }
  }
}

function construirSelectCategorias(contexto) {
  const { StringSelectMenuBuilder } = require('discord.js');
  const categorias = queries.listarCategorias();

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`bau_cat_sel__${contexto}`)
      .setPlaceholder('Escolha a categoria do item')
      .addOptions(
        categorias.map((cat) => ({
          label: cat.nome,
          value: String(cat.id),
          emoji: cat.emoji,
        }))
      )
  );
}

function construirSelectItens(contexto, itens) {
  const { StringSelectMenuBuilder } = require('discord.js');

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`bau_item_sel__${contexto}`)
      .setPlaceholder('Escolha o item')
      .addOptions(
        itens.slice(0, 25).map((item) => ({
          label: formatarOpcaoDisponivel(item.emoji, item.nome, item.quantidade),
          value: String(item.id),
        }))
      )
  );
}

module.exports = {
  handleSelectMenu,
  construirSelectCategorias,
  construirSelectItens,
};
