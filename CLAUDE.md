# Diretrizes de Desenvolvimento — MS-13 / Vietnã Bot

Este arquivo serve como referência de comandos rápidos, arquitetura do projeto e padrões de desenvolvimento.

---

## Comandos Rápidos

### Instalar dependências
```bash
npm install
```

### Iniciar o bot em produção
```bash
node index.js
```

### Iniciar o bot em desenvolvimento (com auto-reload)
```bash
npx nodemon index.js
```

---

## Arquitetura do Projeto

Tudo que for relacionado às funcionalidades do bot está localizado dentro do diretório `src/`:

- `src/commands/` — Slash commands registrados globalmente no Discord.
  - `/bau` — Envia o painel do baú da facção.
  - `/inicial` — Envia o painel de registro de novos membros.
- `src/config/settings.js` — Mapeamento completo de IDs de canais, IDs de cargos da facção e constantes de cores.
- `src/database/` — Conexão com o banco de dados SQLite (`ms13_bau.db`) e encapsulamento de queries (`queries.js`).
- `src/events/` — Ouvintes de eventos globais do client do Discord (Ready, InteractionCreate, GuildMemberAdd, GuildMemberRemove).
- `src/systems/` — Lógicas específicas de negócio divididas por sistemas (`bau` e `registro`).
- `src/utils/` — Funções utilitárias auxiliares de data, formatação de textos e permissões.

---

## Regras de Design e Decisões de Desenvolvimento

1. **Message Components V2 (CV2):**
   - Usado exclusivamente no **Painel do Baú** (`systems/bau/painel.js`), nos **Logs de Registro** (`systems/registro/botoes.js`) e no **Painel de Registro** (`systems/registro/painel.js`).
   - Demais feeds e avisos simples continuam utilizando embeds/markdown tradicionais do Discord por estabilidade.
2. **Caminhos de Arquivos (Robustez):**
   - Sempre utilize `process.cwd()` ao referenciar arquivos estáticos ou banco de dados no disco (como os JSONs da pasta `registros/` e o arquivo SQLite em `data/ms13_bau.db`) para evitar erros ao mover scripts de pastas.
3. **Limitação de Componentes no Canal:**
   - Como os botões do painel do baú são fixos para todos os usuários do canal, o controle de acesso é feito via verificação efêmera no clique do botão. O botão "Gerenciar Baú" exibe erro "sem permissão" caso seja clicado por quem não é líder.
