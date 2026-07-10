# CLAUDE.md — Bot MS-13 Vietnã

## 0. Economia de Token / Formato de Resposta

**Ao ler este arquivo:**
Não resuma nem repita o conteúdo deste CLAUDE.md na resposta. Confirme com uma linha curta (ex: "Li o contexto, pode mandar") e aplique as regras em silêncio.

**Código:**
- Ao editar um arquivo existente, mande só o trecho alterado (função/bloco + 2-3 linhas de contexto antes/depois), nunca o arquivo inteiro re-colado — a menos que seja pedido explicitamente "manda o arquivo completo".
- Não regere ou re-printe arquivos que não foram tocados.
- Não recrie do zero um componente que já existe — edite o que já tem.

**Explicações:**
- Sem preâmbulo tipo "Claro! Vou te ajudar com isso" — vai direto na solução.
- Não reexplique padrões/arquitetura já documentados aqui — só referencie a seção (ex: "segue seção 4").
- Headers markdown (`##`) só se a resposta tiver 3+ blocos distintos; senão, texto corrido ou lista simples.
- Nada de "resumo final" repetindo o que foi dito na própria resposta.

**Ambiguidade:**
- Se a tarefa for pequena ou já tiver padrão documentado aqui, não pergunte — assume o padrão e segue.
- Só pergunta se a ambiguidade puder causar retrabalho real (ex: mexer em permissões, schema do banco, IDs de canal).

**Modo Homem das Cavernas:**
Remove palavras de preenchimento. Resposta direta. Frases curtas de 3 a 6 palavras quando possível. Vai direto ao resultado.

**Skill COMPACTAR:**
Quando dito "COMPACTAR", resume toda a conversa em 5-7 bullets com contexto crítico, decisões e trechos essenciais. Formatado pra copiar e colar em novo chat.

---

## 1. Stack e Versões

- **Runtime:** Node.js ≥ 20
- **Lib:** discord.js v14 ^14.17.0
- **Banco:** better-sqlite3 ^11.0.0
- **Env:** dotenv ^17.4.2
- **Host:** Discloud (RAM 200MB)
- **Repo:** https://github.com/VKDELAS/Bot-JS-Vietn-.git
- **Entrypoint:** `index.js` (raiz)

---

## 2. Estrutura de Pastas

```
index.js                  ← entrypoint, carrega commands/ e events/ de src/
.env                      ← TOKEN=... (nunca vai pro git)
discloud.config           ← config do Discloud (RAM: 512, AUTORESTART: true)
src/
├── commands/
│   └── setup.js          ← slash /setup — posta/atualiza painéis (baú + registro) com comparação de conteúdo
├── config/
│   └── settings.js       ← ÚNICA fonte de IDs, cargos e cores
├── database/
│   ├── bau.js            ← conexão SQLite + schema + seed de categorias
│   └── queries.js        ← TODAS as queries encapsuladas (nada de SQL solto fora daqui)
├── events/
│   ├── ready.js          ← registra sistemas + sincroniza slash commands
│   ├── interactionCreate.js ← roteia slash commands para commands/
│   ├── guildMemberAdd.js ← delega para systems/boasvindas/mensagens.js (CV2)
│   └── guildMemberRemove.js ← delega para systems/boasvindas/mensagens.js (CV2)
├── systems/
│   ├── bau/
│   │   ├── index.js      ← listener persistente (bau_*) registrado no ready
│   │   ├── painel.js     ← monta e edita o painel CV2 do baú
│   │   ├── botoes.js     ← router de cliques (switch no customId)
│   │   ├── selects.js    ← router de selects + modais de guardar/retirar/criar/editar
│   │   ├── modals.js     ← handler de modal submit (grava banco + atualiza painel + loga)
│   │   ├── gerenciar.js  ← submenu só-líder: criar/excluir item, add/remover categoria, reset, editar qtd
│   │   ├── estoque.js    ← ver estoque e itens em falta (efêmero)
│   │   ├── historico.js  ← meu histórico e log geral (efêmero)
│   │   └── log.js        ← dispara Container CV2 no canal de log do baú
│   ├── registro/
│   │   ├── index.js      ← listener persistente (registro_*) registrado no ready
│   │   ├── painel.js     ← constrói Container CV2 do painel de registro
│   │   ├── modals.js     ← modal de cadastro + validações + envia Container CV2 para canal de logs
│   │   ├── botoes.js     ← aprovar/reprovar: add cargo, nick, DM embed, anúncio público, edita mensagem CV2
│   │   └── dm.js         ← (não usado atualmente) monta Container CV2 pra DM de boas-vindas
│   └── boasvindas/
│       └── mensagens.js  ← monta e envia Containers CV2 de entrada/saída nos canais configurados
└── utils/
    ├── permissoes.js     ← ehLider(), ehMembroDaFaccao(), negarPermissao()
    ├── data.js           ← formatarDataHora(isoString) → "dd/mm/aaaa hh:mm"
    └── formatarLinha.js  ← formatarLinhaItem() e formatarOpcaoDisponivel()
```

---

## 3. Configurações Centrais (`src/config/settings.js`)

**TODA alteração de ID vai aqui. Nunca hardcode em outros arquivos.**

```js
TOKEN            → process.env.TOKEN (vem do .env ou Discloud)
BAU_PANEL_CHANNEL_ID    → '1524415283522044014'
BAU_LOG_CHANNEL_ID      → '1524415448995598446'
REGISTRO_CHANNEL_ID     → '1488175523254505583'
REGISTRO_LOGS_CHANNEL_ID → '1488175178738565222'
ANUNCIO_APROVADO_CHANNEL_ID  → '1487942740279824573'
ANUNCIO_REPROVADO_CHANNEL_ID → '1487942740279824574'
ENTRADA_CHANNEL_ID     → '1487942740279824569'
SAIDA_CHANNEL_ID       → '1524585567877071010'

ROLES = {
  EDITOR_SERVER: '1487942738950361126',
  LIDER_01:      '1487942739365593215',
  LIDER_02:      '1487942739365593214',
  LIDER_03:      '1488186374862540802',
  GERENTE_GERAL: '1487942739365593213',
  GERENTE_ACAO:  '1487942739365593211',
  GERENTE_FARM:  '1487942739365593210',
  MEMBRO:        '1487942739365593212',
}

CARGOS_LIDERES              → [EDITOR_SERVER, LIDER_01, LIDER_02]  ← botões restritos do baú
CARGOS_APROVACAO_REGISTRO   → [EDITOR_SERVER, LIDER_01, LIDER_02, GERENTE_GERAL]

CORES = {
  VIETNA:    0x54a0ff,   ← azul claro (cor principal da facção)
  APROVADO:  0x2ecc71,   ← verde
  REPROVADO: 0xe74c3c,   ← vermelho
  ALERTA:    0xffb800,   ← amarelo (pendente/falta)
  INFO:      0x3498db,   ← azul info
  MUTED:     0x2f3136,   ← cinza escuro
}

COR_PAINEL_OK     → 0x2ecc71  (baú ok)
COR_PAINEL_ALERTA → 0xffb800  (baú com item em falta)
```

---

## 4. Banco de Dados

**Arquivo:** `data/ms13_bau.db` (criado automaticamente)
**Caminho:** sempre via `process.cwd()` — nunca `__dirname` para arquivos de dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `bau_categorias` | id, nome, emoji |
| `bau_itens` | id, categoria_id, nome, emoji, quantidade, quantidade_minima, criado_em, atualizado_em |
| `bau_movimentacoes` | id, item_id, usuario_id, usuario_tag, tipo (`entrada`/`saida`/`ajuste_manual`), quantidade, data |
| `bau_painel` | id=1, channel_id, message_id, version (referência do painel fixo) |
| `registro_painel` | id=1, channel_id, message_id, version (referência do painel de registro) |

**Regra:** todo SQL fica em `database/queries.js`. Sistemas importam de lá, nunca escrevem SQL direto.

### Seed de categorias (inseridas no boot se não existirem)
Armas 🔫 | Munição/Explosivos 💣 | Drogas 💊 | Dinheiro 💰 | Coletes/Equipamento 🎽 | Ferramentas/Diversos 🔧

---

## 5. Sistema de Permissões (`utils/permissoes.js`)

```
ehLider(member)           → LIDER_01 ou LIDER_02
ehMembroDaFaccao(member)  → ehLider() OU cargo MEMBRO OU registros/{id}.json com status "aprovado"
negarPermissao(interaction, motivo) → reply efêmero com 🚫
```

**Guardar/Retirar do baú:** exige `ehMembroDaFaccao`
**Log Geral / Itens em Falta / Gerenciar Baú:** exige `ehLider`
**Aprovar/Reprovar registro:** exige cargo em `CARGOS_APROVACAO_REGISTRO`

---

## 6. Sistema do Baú (`systems/bau/`)

### Painel fixo (CV2)
- Postado pelo `/bau` via `enviarPainel(client)` → salva `channel_id + message_id` em `bau_painel`
- Toda movimentação chama `atualizarPainel(client)` → edita a mensagem existente (nunca reposta)
- Cor lateral: verde se tudo ok, amarelo se `existeItemEmFalta()`
- Botões visíveis pra todos; acesso bloqueado por cargo no clique (efêmero de erro)

### CustomId pattern

| Prefixo | Sistema |
|---|---|
| `bau_guardar` | iniciar guardar item |
| `bau_retirar` | iniciar retirar item |
| `bau_ver_estoque` | ver estoque |
| `bau_meu_historico` | histórico pessoal |
| `bau_log_geral` | log geral (líder) |
| `bau_itens_falta` | itens em falta (líder) |
| `bau_gerenciar` | abre submenu gerenciar |
| `bau_ger_criar_item` | criar item novo |
| `bau_ger_add_categoria` | nova categoria |
| `bau_ger_retirar_categoria` | remover categoria (só se vazia) |
| `bau_ger_excluir_item` | excluir item + histórico |
| `bau_ger_resetar_item` | zerar item |
| `bau_ger_editar_qtd` | editar quantidade manual |
| `bau_cat_sel__{contexto}` | select de categoria |
| `bau_item_sel__{contexto}` | select de item |
| `bau_modal_guardar__{categoriaId}` | modal submit guardar |
| `bau_modal_retirar__{itemId}` | modal submit retirar |
| `bau_modal_criar_item__{categoriaId}` | modal submit criar item |
| `bau_modal_add_categoria` | modal submit nova categoria |
| `bau_modal_editar_qtd__{itemId}` | modal submit editar qtd |
| `bau_confirmar_reset__{itemId}` | botão confirmar reset |
| `bau_confirmar_excluir__{itemId}` | botão confirmar exclusão |
| `bau_ger_sel_deletar_cat` | select de deletar categoria |
| `bau_cancelar` | cancelar ação |

### Fluxo Guardar
`bau_guardar` → select categoria (`bau_cat_sel__guardar`) → modal (`bau_modal_guardar__{catId}`) → grava banco → `atualizarPainel` → `logarMovimentacao`

### Fluxo Retirar
`bau_retirar` → select itens disponíveis (`bau_item_sel__retirar`) → modal quantidade → valida ≤ disponível → grava banco → `atualizarPainel` → `logarMovimentacao`

### Log automático (CV2)
Toda movimentação manda Container CV2 no `BAU_LOG_CHANNEL_ID` com badge + item + thumbnail do usuário.

---

## 7. Sistema de Registro (`systems/registro/`)

### Painel fixo (CV2)
- Postado pelo `/inicial` no `REGISTRO_CHANNEL_ID`
- Container com cor `CORES.VIETNA` (azul claro), brasão da facção via thumbnail
- Um botão: `registro_abrir` → abre modal

### Modal de cadastro
Campos: Nome Completo, ID (1-20000), Número (DDD 01 ou 02)
Validações em ordem:
1. Nome sem dígitos (`/\d/`)
2. ID só dígitos + range 1-20000
3. Número sem letras (`/[a-zA-Z]/`)
4. Número começa com 01 ou 02 (só dígitos extraídos)

Após validação: salva `registros/{user.id}.json` com `status: "pendente"`, envia Container CV2 no `REGISTRO_LOGS_CHANNEL_ID` com cor ALERTA (amarelo) e botões Aprovar/Reprovar.

### Botões de aprovação
`registro_aprovar__{userId}` / `registro_reprovar__{userId}`

**Aprovar:**
1. Verifica `CARGOS_APROVACAO_REGISTRO`
2. Adiciona cargo `ROLES.MEMBRO`
3. Seta nickname `Nome | ID`
4. Edita mensagem → Container CV2 verde (APROVADO), sem botões
5. Envia DM Embed azul de boas-vindas
6. Envia anúncio público no `ANUNCIO_APROVADO_CHANNEL_ID`
7. Atualiza JSON → `status: "aprovado"`

**Reprovar:**
1. Verifica `CARGOS_APROVACAO_REGISTRO`
2. Edita mensagem → Container CV2 vermelho (REPROVADO), sem botões
3. Envia DM Embed de recusa
4. Envia aviso no `ANUNCIO_REPROVADO_CHANNEL_ID`
5. Atualiza JSON → `status: "reprovado"`

### CustomId pattern

| CustomId | Ação |
|---|---|
| `registro_abrir` | abre modal de cadastro |
| `registro_modal` | submit do modal |
| `registro_aprovar__{userId}` | aprovar registro |
| `registro_reprovar__{userId}` | reprovar registro |

---

## 8. Components V2 (CV2) — Regras de Uso

CV2 usado **exclusivamente** em:
- Painel do baú (`systems/bau/painel.js`)
- Painel de registro (`systems/registro/painel.js`)
- Mensagens de log de aprovação/reprovação de registro (`systems/registro/botoes.js`)
- Log de movimentações do baú (`systems/bau/log.js`)
- Mensagens de entrada/saída da facção (`systems/boasvindas/mensagens.js`)

**Todo o resto** usa markdown/embeds normais (DMs, mensagens efêmeras simples).

Mensagens CV2 **obrigatoriamente** precisam do flag:
```js
flags: MessageFlags.IsComponentsV2
```

Builders disponíveis: `ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `ThumbnailBuilder`, `SeparatorBuilder`, `ActionRowBuilder`, `ButtonBuilder`.

---

## 9. Arquivos de Dados em Disco

| Caminho | Conteúdo |
|---|---|
| `data/ms13_bau.db` | banco SQLite do baú |
| `registros/{userId}.json` | dados de registro de cada membro |

**Sempre** usar `process.cwd()` pra resolver esses caminhos. Exemplo:
```js
path.join(process.cwd(), 'registros', `${userId}.json`)
path.join(process.cwd(), 'data', 'ms13_bau.db')
```

---

## 10. Como Adicionar Funcionalidades

### Novo slash command
1. Cria `src/commands/novocomando.js` com `{ data, execute }`
2. O `index.js` já carrega automaticamente tudo de `src/commands/`
3. Sync acontece no `ready.js` automaticamente

### Novo botão no baú
1. Adiciona o `customId` com prefixo `bau_` no `painel.js` ou `gerenciar.js`
2. Adiciona o case no switch de `botoes.js`
3. Implementa a lógica no arquivo relevante

### Nova query
1. Adiciona só em `database/queries.js`
2. Importa via `const queries = require('../../database/queries')`

### Novo evento Discord
1. Cria `src/events/nomeEvento.js` com `{ name, once, execute }`
2. O `index.js` já carrega automaticamente

---

## 11. Deploy (Discloud)

- **Token:** configurar em Variáveis de Ambiente do painel Discloud (`TOKEN=...`)
- **RAM:** 200MB (definido no `discloud.config`)
- **Autorestart:** ativo
- **`node_modules/` e `.env`** nunca vão pro deploy (`.discloudignore`)
- Discloud roda `npm install` automaticamente

---

## 12. Regras de Formatação de Linhas

Padrão fixo pra todo lugar que lista item:
```
{emoji} {nome} — {quantidade}
```
Função: `formatarLinhaItem(emoji, nome, quantidade)` em `utils/formatarLinha.js`

Select menu de retirar:
```
🔫 AK-47 (3 disponíveis)
```
Função: `formatarOpcaoDisponivel(emoji, nome, quantidade)` em `utils/formatarLinha.js`
