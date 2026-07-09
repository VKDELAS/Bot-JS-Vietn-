// ============================================================
// config/settings.js
// Configurações e mapeamento completo de cargos, canais e cores.
// ============================================================

require('dotenv').config();

module.exports = {
  // --- Token do Bot ---
  // Configure no arquivo .env: TOKEN=seu_token_aqui
  // No Discloud: configure pela aba "Variáveis de Ambiente" do painel
  TOKEN: process.env.TOKEN,

  // --- Canais do Discord ---
  // Canal onde o painel fixo do baú vive (posta uma vez, depois apenas edita)
  BAU_PANEL_CHANNEL_ID: '1524415283522044014',

  // Canal onde cada entrada/saída/ajuste manual do baú é logada automaticamente
  BAU_LOG_CHANNEL_ID: '1524415448995598446',

  // Canal onde os membros clicam para iniciar o formulário de registro
  REGISTRO_CHANNEL_ID: '1488175523254505583',

  // Canal onde os novos registros chegam para a aprovação dos superiores
  REGISTRO_LOGS_CHANNEL_ID: '1488175178738565222',

  // Canal onde é anunciado publicamente quando alguém é aprovado na facção
  ANUNCIO_APROVADO_CHANNEL_ID: '1487942740279824573',

  // Canal onde é registrado quando uma ficha é reprovada
  ANUNCIO_REPROVADO_CHANNEL_ID: '1487942740279824574',

  // Canal onde a mensagem de boas-vindas é enviada quando alguém entra no servidor
  ENTRADA_CHANNEL_ID: '1487942740279824569',

  // Canal onde a mensagem de despedida é enviada quando alguém sai do servidor
  SAIDA_CHANNEL_ID: '1524585567877071010',

  // --- Cargos da Facção (Mapeamento Completo) ---
  ROLES: {
    EDITOR_SERVER: '1487942738950361126', // 🔒 ✍️ EDITOR DO SERVER
    LIDER_01:      '1487942739365593215', // 👑 01
    LIDER_02:      '1487942739365593214', // 🥉 02
    LIDER_03:      '1488186374862540802', // 🥉 03
    GERENTE_GERAL: '1487942739365593213', // 🧑💼 GERENTE GERAL
    GERENTE_ACAO:  '1487942739365593211', // 🔫 GERENTE DE AÇÃO
    GERENTE_FARM:  '1487942739365593210', // 🧑🌾 GERENTE DE FARM
    MEMBRO:        '1487942739365593212', // 🤝 MEMBRO
  },

  // --- Níveis de Acesso ---
  // Apenas cargos 01 e 02 têm acesso aos botões restritos do baú (Ex: Log Geral, Itens em Falta, Gerenciar)
  CARGOS_LIDERES: [
    '1487942738950361126', // EDITOR DO SERVER
    '1487942739365593215', // 01
    '1487942739365593214', // 02
  ],

  // Cargos permitidos para aprovar ou reprovar os registros (01, 02 e Gerente Geral)
  CARGOS_APROVACAO_REGISTRO: [
    '1487942738950361126', // EDITOR DO SERVER
    '1487942739365593215', // 01
    '1487942739365593214', // 02
    '1487942739365593213', // Gerente Geral
  ],

  // --- Informações da Facção ---
  FAC_NOME: 'Vietnã',
  // URL pública do brasão ou logotipo da facção (usada nos embeds/containers V2)
  IMAGEM_FACCAO_URL: 'https://cdn.discordapp.com/attachments/1487938963317719306/1524534627484696629/ChatGPT_Image_27_06_2026_02_34_25.png?ex=6a501903&is=6a4ec783&hm=6bea7af7afdd7af81026f05475d5fdf5a2020b4003f25a45b25812d3ab28f9bb&', // Brasão/Design Vietnã estilizado

  // --- Definições do Baú ---
  DIAS_MEMBRO_ATIVO: 7, // Quantos dias determinam a atividade de um membro no painel

  // Categorias padrão para seed inicial no SQLite
  CATEGORIAS_PADRAO: [
    { nome: 'Armas', emoji: '🔫' },
    { nome: 'Munição/Explosivos', emoji: '💣' },
    { nome: 'Drogas', emoji: '💊' },
    { nome: 'Dinheiro', emoji: '💰' },
    { nome: 'Coletes/Equipamento', emoji: '🎽' },
    { nome: 'Ferramentas/Diversos', emoji: '🔧' },
  ],

  // --- Paletas de Cores Estilizadas (Aesthetics Premium) ---
  COR_PAINEL_OK: 0x2ecc71,     // verde — tudo acima do mínimo
  COR_PAINEL_ALERTA: 0xffb800, // amarelo — tem item em falta

  CORES: {
    VIETNA: 0x54a0ff,       // Azul claro da facção Vietnã (com branco)
    APROVADO: 0x2ecc71,     // Verde esmeralda para aprovados / estoque OK
    REPROVADO: 0xe74c3c,    // Vermelho escarlate para reprovados
    ALERTA: 0xffb800,       // Amarelo dourado para itens em falta / registros pendentes
    INFO: 0x3498db,         // Azul brilhante para ver estoque / históricos
    MUTED: 0x2f3136,        // Cinza escuro discreto
  },

  // Versão do design dos painéis. Mude este valor sempre que alterar
  // o layout do painel do baú ou de registro para forçar o /setup a reenviar.
  SETUP_VERSION: 'v3',
};
