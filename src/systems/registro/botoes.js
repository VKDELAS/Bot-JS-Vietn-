// ============================================================
// src/systems/registro/botoes.js
// Lógica para os cliques de botões de aprovação e reprovação.
// ============================================================

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const {
  ROLES,
  CARGOS_APROVACAO_REGISTRO,
  CORES,
  FAC_NOME,
  ANUNCIO_APROVADO_CHANNEL_ID,
  ANUNCIO_REPROVADO_CHANNEL_ID,
} = require('../../config/settings');
const { negarPermissao } = require('../../utils/permissoes');

/**
 * Lida com o clique nos botões de registro (Aprovar / Reprovar)
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('discord.js').Client} client
 */
async function handleButton(interaction, client) {
  // Verifica se o usuário tem permissão para aprovar ou reprovar
  const temPermissao = CARGOS_APROVACAO_REGISTRO.some((roleId) =>
    interaction.member.roles.cache.has(roleId)
  );

  if (!temPermissao) {
    return negarPermissao(interaction, 'Você não tem permissão para processar este registro.');
  }

  const customId = interaction.customId;
  const isAprovar = customId.startsWith('registro_aprovar__');
  const targetUserId = customId.split('__')[1];

  await interaction.deferReply({ ephemeral: true });

  const pathRegistro = path.join(process.cwd(), 'registros', `${targetUserId}.json`);
  if (!fs.existsSync(pathRegistro)) {
    return interaction.editReply({ content: '❌ Arquivo de registro não encontrado no sistema.' });
  }

  let dados;
  try {
    dados = JSON.parse(fs.readFileSync(pathRegistro, 'utf8'));
  } catch (erro) {
    return interaction.editReply({ content: '❌ Erro ao ler os dados do registro.' });
  }

  if (dados.status !== 'pendente') {
    return interaction.editReply({ content: '⚠️ Esse registro já foi processado anteriormente.' });
  }

  const guild = interaction.guild;
  const membro = await guild.members.fetch(targetUserId).catch(() => null);

  if (!membro) {
    return interaction.editReply({
      content: '❌ Membro não encontrado no servidor de Discord (ele pode ter saído).',
    });
  }

  if (isAprovar) {
    // --- Fluxo de Aprovação ---

    // 1. Adiciona o cargo de Membro
    const roleMembro = guild.roles.cache.get(ROLES.MEMBRO);
    if (roleMembro) {
      try {
        await membro.roles.add(roleMembro, `Registro aprovado por ${interaction.user.tag}`);
      } catch (erro) {
        console.error('[registro] Erro ao adicionar cargo de membro:', erro.message);
      }
    } else {
      console.error('[registro] Cargo de Membro não encontrado nas configurações.');
    }

    // 2. Altera o nickname para "Nome | ID"
    const novoNick = `${dados.nome} | ${dados.id_fac}`;
    try {
      await membro.setNickname(novoNick, `Registro aprovado por ${interaction.user.tag}`);
    } catch (erro) {
      console.error('[registro] Não foi possível alterar o nickname do membro:', erro.message);
    }

    // 3. Atualiza a mensagem no canal de logs
    const container = new ContainerBuilder().setAccentColor(CORES.APROVADO);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `✅ <@${targetUserId}> aprovado por <@${interaction.user.id}> — <t:${Math.floor(Date.now() / 1000)}:R>`
      )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ✅ Registro Aprovado\n-# Aprovado por <@${interaction.user.id}>`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(membro.user.displayAvatarURL({ dynamic: true }))
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Discord** · <@${targetUserId}>\n` +
        `**Nome** · ${dados.nome}\n` +
        `**ID** · \`${dados.id_fac}\`\n` +
        `**Número** · \`${dados.numero}\``
      )
    );

    await interaction.message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    // 4. Envia DM amigável de boas-vindas
    try {
      const embedDM = new EmbedBuilder()
        .setTitle(`🇻🇳 Bem-vindo(a) à Facção ${FAC_NOME}!`)
        .setDescription(
          `Olá, **${dados.nome}**! Seu registro foi analisado e **APROVADO** por nossa gerência.\n\n` +
          `Agora você faz parte da nossa família. Respeite as regras, seja leal e honre nossa bandeira.`
        )
        .setColor(CORES.VIETNA)
        .setTimestamp()
        .addFields(
          { name: '🪪 Nome no Registro', value: dados.nome, inline: true },
          { name: '🆔 Seu ID', value: dados.id_fac, inline: true },
          { name: '📌 Status', value: '✅ Membro Oficial', inline: false }
        )
        .setFooter({
          text: `${FAC_NOME} • Metroville • Aprovado por ${interaction.user.username}`,
        });

      if (guild.iconURL()) {
        embedDM.setThumbnail(guild.iconURL({ dynamic: true }));
      }

      await membro.send({ embeds: [embedDM] });
    } catch (erro) {
      console.warn(`[registro] Não foi possível enviar DM para ${membro.user.tag}:`, erro.message);
    }

    // 4.5. Anúncio público no canal da facção
    try {
      const canalAnuncio = guild.channels.cache.get(ANUNCIO_APROVADO_CHANNEL_ID);
      if (canalAnuncio) {
        await canalAnuncio.send(
          `🇻🇳 **FECHOU COM A ${FAC_NOME.toUpperCase()}!**\n\n` +
          `Levanta a bandeira pro <@${targetUserId}>, mano! Mais um soldado entrando pra somar com a família.\n\n` +
          `> Respeito é rua, lealdade é lei. Bem-vindo à ${FAC_NOME}, seu nome agora é peso na quebrada. 💪🔫`
        );
      } else {
        console.error('[registro] Canal de anúncio de aprovado não encontrado.');
      }
    } catch (erro) {
      console.warn('[registro] Erro ao enviar anúncio de aprovado:', erro.message);
    }

    // 5. Salva os dados atualizados
    dados.status = 'aprovado';
    dados.aprovado_por = interaction.user.tag;
    dados.processado_em = new Date().toISOString();
    fs.writeFileSync(pathRegistro, JSON.stringify(dados, null, 2), 'utf8');

    await interaction.editReply({
      content: `✅ **${dados.nome}** foi aprovado(a) e registrado(a) com sucesso!`,
    });

  } else {
    // --- Fluxo de Reprovação ---

    // 1. Atualiza a mensagem no canal de logs
    const container = new ContainerBuilder().setAccentColor(CORES.REPROVADO);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `❌ <@${targetUserId}> reprovado por <@${interaction.user.id}> — <t:${Math.floor(Date.now() / 1000)}:R>`
      )
    );
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ❌ Registro Reprovado\n-# Reprovado por <@${interaction.user.id}>`
          )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(membro.user.displayAvatarURL({ dynamic: true }))
        )
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Discord** · <@${targetUserId}>\n` +
        `**Nome** · ${dados.nome}\n` +
        `**ID** · \`${dados.id_fac}\`\n` +
        `**Número** · \`${dados.numero}\``
      )
    );

    await interaction.message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    // 2. Tenta notificar por DM
    try {
      const embedDM = new EmbedBuilder()
        .setTitle(`❌ Registro Recusado — ${FAC_NOME}`)
        .setDescription(
          `Olá, **${dados.nome}**.\n\n` +
          `Seu registro foi enviado para análise, mas infelizmente foi **REPROVADO** pela nossa gerência.\n\n` +
          `Entre em contato com um superior se tiver alguma dúvida.`
        )
        .setColor(CORES.REPROVADO)
        .setTimestamp()
        .setFooter({ text: `${FAC_NOME} • Metroville` });

      await membro.send({ embeds: [embedDM] });
    } catch (erro) {
      console.warn(`[registro] Não foi possível enviar DM de recusa para ${membro.user.tag}:`, erro.message);
    }

    // 2.5. Registro no canal de reprovados
    try {
      const canalAnuncio = guild.channels.cache.get(ANUNCIO_REPROVADO_CHANNEL_ID);
      if (canalAnuncio) {
        await canalAnuncio.send(
          `🚫 **FICHA NEGADA**\n\n` +
          `<@${targetUserId}> não fechou com a ${FAC_NOME} dessa vez. Ficha não passou pela gerência.\n\n` +
          `> Quem sabe numa próxima, mano. A quebrada tem os próprios critérios.`
        );
      } else {
        console.error('[registro] Canal de anúncio de reprovado não encontrado.');
      }
    } catch (erro) {
      console.warn('[registro] Erro ao enviar anúncio de reprovado:', erro.message);
    }

    // 3. Salva os dados atualizados
    dados.status = 'reprovado';
    dados.reprovado_por = interaction.user.tag;
    dados.processado_em = new Date().toISOString();
    fs.writeFileSync(pathRegistro, JSON.stringify(dados, null, 2), 'utf8');

    await interaction.editReply({
      content: `❌ Registro de **${dados.nome}** reprovado com sucesso.`,
    });
  }
}

module.exports = { handleButton };
