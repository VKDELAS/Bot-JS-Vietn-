# Sistema de Baú da Facção — MS-13 Bot

Sistema completo e separado por responsabilidade, pronto pra encaixar no bot que já existe.

## Estrutura

```
src/
├── commands/
│   └── bau.js            → slash command /bau (posta o painel fixo)
├── config/
│   └── settings.js       → IDs de canais, cargo líder, categorias padrão
├── database/
│   ├── bau.js             → conexão + schema do SQLite (ms13_bau.db)
│   └── queries.js         → todas as queries, isoladas num só lugar
├── systems/bau/
│   ├── index.js            → ponto de entrada (registra o listener de interações)
│   ├── painel.js            → monta e edita o painel fixo (Components V2)
│   ├── botoes.js             → roteador dos cliques de botão
│   ├── selects.js             → roteador dos select menus + modais reaproveitados
│   ├── modals.js               → grava no banco quando um modal é enviado
│   ├── gerenciar.js             → submenu "Gerenciar Baú" (só líder)
│   ├── estoque.js                → "Ver Estoque" / "Itens em Falta"
│   ├── historico.js               → "Meu Histórico" / "Log Geral"
│   └── log.js                      → mensagem automática no canal de log
└── utils/
    ├── formatarLinha.js    → padrão fixo "{nome} — {quantidade}"
    ├── data.js              → formata datas dd/mm/aaaa hh:mm
    └── permissoes.js         → checagem de líder / membro da facção
```

data/ms13_bau.db é criado automaticamente na primeira execução (schema + seed
das 6 categorias padrão).

## Como integrar no bot que já existe

1. **Copie a pasta `src/` deste pacote pra dentro do projeto do bot**, mesclando
   com o que já existe (não sobrescreve nada — os nomes de arquivo são todos
   novos: `bau.js`, `queries.js`, pasta `systems/bau/`, etc).

2. **Instale as dependências** (se ainda não tiver):
   ```
   npm install discord.js@latest better-sqlite3
   ```
   ⚠️ Componentes V2 (Container, Section, Thumbnail, Separator) só existem em
   versões recentes do discord.js. Se der erro de `ContainerBuilder is not a
   constructor` ou parecido, roda `npm ls discord.js` e atualiza pra última
   versão estável.

3. **No `main.js`** (ou onde o client é criado e fica o `ready`), adicione:
   ```js
   const { registrarSistemaBau } = require('./src/systems/bau');

   client.once('ready', () => {
     registrarSistemaBau(client);
   });
   ```

4. **Registre o slash command** `/bau` do jeito que os outros comandos já são
   registrados no seu `deploy-commands.js` (ou equivalente) — é só apontar pra
   `src/commands/bau.js` igual aos outros.

5. **Ajuste `src/config/settings.js`**:
   - `CARGO_LIDER_ID`: coloque o ID real do cargo de líder da facção.
   - `IMAGEM_FACCAO_URL`: coloque a URL da imagem/brasão da facção.
   - Os canais do painel e do log já vêm preenchidos com os IDs que você mandou.

6. **Integração com `membros.js`** (permissão de Guardar/Retirar): o spec pede
   pra checar contra a tabela de membros que já existe no seu bot. Como esse
   arquivo não foi enviado, deixei um placeholder em `utils/permissoes.js`
   (função `ehMembroDaFaccao`) que libera qualquer pessoa do servidor. Tem um
   comentário `TODO` explicando exatamente o que trocar pra plugar na tabela
   real.

## Sobre o painel e os botões só-de-líder

Uma ressalva técnica importante: como o painel é **uma mensagem fixa** editada
pro servidor inteiro ver, não existe como o Discord "esconder" um botão só pra
quem não tem o cargo de líder — todo mundo que abre o canal vê os mesmos
componentes. O que este sistema faz (e é o padrão usado nesse tipo de bot) é:
os botões "Log Geral", "Itens em Falta" e "Gerenciar Baú" aparecem pra todos,
mas quem clica sem ser líder recebe uma resposta efêmera de "sem permissão" —
só o líder consegue realmente ver o conteúdo.

## Dashboard Next.js (seção 6 do spec)

Não incluí o dashboard Next.js neste pacote porque ele é um projeto separado
(Vercel) e o spec original te dá duas opções de arquitetura pra escolher
(acesso direto ao SQLite vs. API HTTP exposta pelo bot). Se quiser, eu já
implemento a próxima etapa (as páginas `/`, `/estoque`, `/logs` + a API que
você escolher) — é só falar qual das duas opções (A ou B) você quer seguir.

## Trecho pra colar no seu CLAUDE.md

```
## Baú da Facção
- CV2 (Components V2) usado em CentralTicketsView E PainelBauView — demais
  painéis continuam em markdown nativo por estabilidade. Exceção deliberada.
- Painel fixo do baú fica só no canal 1524415283522044014, editado via
  atualizarPainel() — nunca reposta.
- Log automático de cada movimentação vai pro canal 1524415448995598446.
- Botões de líder (Log Geral / Itens em Falta / Gerenciar Baú) aparecem pra
  todo mundo no painel fixo, mas o clique é bloqueado por permissão — não dá
  pra esconder botão por usuário numa mensagem de canal compartilhada.
```
