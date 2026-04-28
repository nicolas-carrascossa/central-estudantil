# Sessão 1 — Quick wins de qualidade

Sessão **TIME-BOXED em 1h30**: ~1h pra Tarefa A (LGPD), ~30min pras Tarefas B e C juntas. Se A estourar, B e C podem ficar pra outra sessão — nunca o contrário. **A é a prioridade absoluta.**

Ordem estrita: **A → B → C → D**. Não pula, não inverte.

---

## Filosofia desta sessão

- **Bug fixes cirúrgicos.** Não é hora de refactor além do mínimo necessário pra cada fix.
- **Não introduzir libs novas.** Usar só o que já existe.
- **Antes de mudar, ler.** Em qualquer arquivo que você for editar, abre e lê primeiro. Não inventa estrutura.
- **Pergunta antes de afirmar sobre estado real do código.** Se algo não bate com a spec, para e pergunta — não improvisa.
- Convenções do projeto continuam valendo: server actions retornam `{ success, error? }`, nunca throw; `revalidatePath` após mutação; tokens Tailwind em vez de hex; pt-BR em tudo.

---

## Pré-requisitos (rodar antes de começar a Tarefa A)

### P.1 — Branch limpa e atualizada

Confirmar comigo (usuário) que estamos em `main` atualizada com o último PR mergeado (PR #2 — visual polish). Em seguida:

```bash
git checkout main
git pull origin main
git checkout -b claude/sessao-1-quick-wins-qualidade
```

Não criar branch antes de confirmar comigo que `main` local está sincronizada com `origin/main`.

### P.2 — Verificar dados de teste pra validação da LGPD (Tarefa A)

A validação manual da Tarefa A exige que exista pelo menos 1 booking `APPROVED` criado por um usuário diferente do que vou usar pra logar e testar. Antes de codar, rodar (via `npx prisma studio` ou query SQL direta no Neon):

```sql
SELECT b.id, b.title, b.status, b."createdById", u.email AS creator_email
FROM "Booking" b
JOIN "User" u ON b."createdById" = u.id
WHERE b.status = 'APPROVED'
ORDER BY b.date DESC
LIMIT 5;
```

> Atenção: nomes de tabelas/colunas no Postgres do Prisma podem precisar das aspas (`"Booking"`, `"User"`, `"createdById"`). Ajustar conforme o schema gerado.

Mostrar o resultado pra mim. Se não houver APPROVED de outros usuários, eu crio bookings de teste antes de prosseguir com a validação. Esse passo **não bloqueia codar a Tarefa A**, mas bloqueia o passo de validação manual no DoD.

---

## Tarefa A — LGPD: filtrar campos sensíveis em `getBookingsByMonth` (~1h)

**Arquivo principal:** `server/booking.ts` (action `getBookingsByMonth`).
**Arquivos de impacto secundário:** `app/(protected)/dashboard/_components/calendar.tsx` (ajuste de tipo + uso de `isOwn`).

### Contexto / decisões já tomadas (não re-perguntar)

- **Problema:** hoje, `getBookingsByMonth` retorna o booking completo (incluindo `externalGuests` com CPF, `clubEmail`, `representativeEmail`, `createdBy.{name,email}`) mesmo pra bookings que o usuário **não é dono**. O modal modo `"public"` esconde na UI, mas o dado já chegou no browser — vazamento confirmado em payload RSC.
- **Estratégia:** **duas queries com `select` distinto**, executadas em **`Promise.all`**, mescladas e ordenadas no servidor antes de retornar. Não usar pós-processamento (filtrar campos depois) — o objetivo é minimização de dados na origem (LGPD art. 6º).
- **Tipo de retorno:** **união discriminada** com flag `isOwn: boolean`.
- **Escopo:** apenas `getBookingsByMonth` (rota do usuário). **NÃO mexer** em `adminGetBookingsByMonth` (admin vê tudo, sempre).
- **Ordenação garantida no retorno:** `date asc, startTime asc` (invariante — o calendário depende disso).

### Schema de retorno detalhado

#### Caso "owner" (booking criado pelo usuário logado)

Trazer **todos os campos que o Prisma já retorna por padrão hoje** (não definir select explícito) + `isOwn: true`. Verifique no código atual o que `findMany` retorna sem select customizado (incluindo a relação `createdBy` que provavelmente vem via `include`) e mantenha exatamente isso. Não adicionar campos que hoje não vêm; não remover campos que hoje vêm.

#### Caso "public" (APPROVED criado por outro usuário)

Trazer **apenas** (select explícito, minimização):

- `id`, `title`, `description`, `date`, `startTime`, `endTime`
- `approvedSpace`
- `status` (será sempre `"APPROVED"` pelo filtro, mas mantém pra consistência de tipo)
- **+ `isOwn: false`**

**Cortar (NÃO trazer no select):**

- `externalGuests`, `clubEmail`, `representativeEmail`
- `createdBy` (objeto inteiro), `createdById`
- `spaceFirstOption`, `spaceSecondOption` (público só vê o que foi aprovado)
- `importedFromSpreadsheet`, `createdAt`, `updatedAt`

### Implementação esperada (alto nível)

1. Em `server/booking.ts`, dentro de `getBookingsByMonth`:
   - Pegar `session.user.id`.
   - Query 1 (owned): bookings do mês onde `createdById === session.user.id`. **Sem select explícito** (mantém o shape atual, seja qual for — `findMany` puro ou com `include`).
   - Query 2 (`publicSelect`): bookings do mês onde `createdById !== session.user.id` AND `status === "APPROVED"`, com select reduzido conforme schema acima.
   - Rodar com `Promise.all([query1, query2])`.
   - Mapear resultados adicionando `isOwn: true` / `isOwn: false`.
   - Mesclar arrays e ordenar por `date asc, startTime asc`.
   - Retornar.

2. Tipos:
   - Definir 2 tipos: `OwnedBookingDTO` e `PublicBookingDTO`.
   - Tipo final: `type BookingDTO = OwnedBookingDTO | PublicBookingDTO`.
   - Pro owned, derivar do retorno real do `findMany` atual (TS infere). Pro public, usar `Prisma.BookingGetPayload<{ select: typeof publicSelect }>`. Interceptar `& { isOwn: true }` / `& { isOwn: false }`.

3. Em `calendar.tsx`:
   - Atualizar o tipo inferido (`Awaited<ReturnType<typeof getBookingsByMonth>>[number]` continua funcionando — só vai ser união agora).
   - Trocar `booking.createdById === currentUserId` por `booking.isOwn` na decisão de modo (`"owner"` vs `"public"`) ao abrir o modal.
   - **Verificar se `currentUserId` é usado em outro lugar do componente**: rodar `grep -n currentUserId` no arquivo. Se for usado SÓ pra discriminar modo do modal, **remover a prop e a passagem desde o server component pai**. Se for usado em outro lugar, manter. **Reportar pra mim qual foi o caso** com a lista de ocorrências antes de decidir.
   - Onde o código acessa campos sensíveis (ex: render condicional), usar narrowing por `isOwn` pra TS aceitar.

4. Em `booking-details-modal.tsx`:
   - **Não precisa mudar a lógica do modal.** Ele já recebe `mode` como prop. Mas vale conferir se o modal acessa campos sensíveis sem checar `mode === "owner"` primeiro — se acessar, o TS vai reclamar agora que o tipo é união. Adaptar narrowing se necessário.

### DoD da Tarefa A

- [ ] `pnpm lint` passa
- [ ] `pnpm build` passa
- [ ] Tipo de retorno de `getBookingsByMonth` é união discriminada com `isOwn`
- [ ] `adminGetBookingsByMonth` **inalterado** (verificar via `git diff`)
- [ ] Array retornado ordenado por `date asc, startTime asc` independente da query de origem (invariante)
- [ ] Resultado da decisão sobre `currentUserId` (manter ou remover) reportado
- [ ] **Reiniciar o dev server antes da validação manual:** `Ctrl+C` e `pnpm dev` (ou `npm run dev`) novamente. Next 16 com RSC pode ter cache agressivo de tipos/payloads em hot reload — restart garante payload limpo.
- [ ] **Validação manual de payload (OBRIGATÓRIO — não pula):**
  1. Login como user comum (NÃO admin), em conta diferente da que criou os bookings de teste identificados em P.2
  2. Garantir que existe ≥ 1 booking `APPROVED` de outro clube no mês visualizado
  3. Abrir DevTools → aba Network
  4. Recarregar `/dashboard`
  5. Localizar a chamada que retorna a lista de bookings — atenção: Next 16 + App Router serializa via RSC (flight data), não necessariamente JSON puro. Procurar nos requests pelo conteúdo dos campos esperados; se não achar como JSON convencional, buscar pelos nomes dos campos no payload streaming (Ctrl+F dentro da resposta da rota `/dashboard`)
  6. **No payload do booking de OUTRO clube — CONFIRMAR AUSÊNCIA de:** `externalGuests`, `clubEmail`, `representativeEmail`, `createdBy`, `createdById`, `spaceFirstOption`, `spaceSecondOption`
  7. **No payload do booking PRÓPRIO — CONFIRMAR PRESENÇA de** todos os campos acima (regressão check)
  8. Reportar pra mim com print ou colando o trecho do payload (com CPF/email mascarados)
  9. **Teste extra com admin:** Logout, login como admin, acessar `/dashboard` (admin ainda pode acessar — é pendência do backlog)
  10. Confirmar que admin como dono recebe payload completo dos seus próprios bookings em `/dashboard`
  11. Confirmar que admin vendo APPROVED de outros em `/dashboard` recebe payload reduzido também (mesma regra que user comum — `/dashboard` usa `getBookingsByMonth`, não a action de admin)
- [ ] Verificação visual: clicar num APPROVED de outro clube ainda abre o modal modo `"public"` corretamente; clicar num próprio abre `"owner"` corretamente

### Commit ao final da Tarefa A

```
fix(lgpd): filtra campos sensiveis em getBookingsByMonth para nao-donos

- Duas queries com select distinto (owned vs public) executadas em paralelo
- Tipo de retorno vira união discriminada com isOwn:boolean
- Calendar usa booking.isOwn pra decidir modo do modal
- adminGetBookingsByMonth inalterado
```

---

## Tarefa B — Guard no `seed-first-admin` (~15min)

**Arquivo principal:** `app/api/seed-first-admin/route.ts`.

### Contexto / decisões já tomadas

- **Problema:** rota POST pública sem checagem de "já existe admin". Qualquer um pode criar admin enquanto a rota estiver no ar.
- **Critério do guard:** contar usuários com `role === "admin"` no banco. Se `count >= 1`, bloquear.
- **Resposta de bloqueio:** HTTP 403 com corpo neutro (ex: `{ error: "Operação não permitida" }`). Não revelar que admin já existe — mensagem genérica.
- **Logging:** `console.warn` quando o guard bloqueia, com info mínima útil pra audit (timestamp já vem do log; logar `[seed-first-admin] tentativa bloqueada — admin ja existe`).
- **NÃO adicionar env flag** (`ALLOW_SEED_FIRST_ADMIN` ou similar). Mantém simples.

### Implementação esperada

1. **Antes de qualquer mudança, ler `app/api/seed-first-admin/route.ts` completo.** Não inventar estrutura do body — usar o que já está lá. Reportar pra mim a estrutura atual antes de mexer (em uma linha: "rota recebe body com campos X, Y, Z; usa fluxo W").
2. Adicionar no início do handler POST, antes de qualquer outra lógica:
```ts
   const adminCount = await prisma.user.count({ where: { role: "admin" } });
   if (adminCount >= 1) {
     console.warn("[seed-first-admin] tentativa bloqueada — admin ja existe");
     return NextResponse.json({ error: "Operação não permitida" }, { status: 403 });
   }
```
3. Manter o resto do handler como está (criação do admin se passou no guard).

### DoD da Tarefa B

- [ ] `pnpm lint` passa
- [ ] `pnpm build` passa
- [ ] Guard adicionado **antes** da criação do admin
- [ ] Resposta 403 com corpo neutro (sem revelar motivo específico)
- [ ] `console.warn` chamado no caminho de bloqueio
- [ ] Validação manual: com banco que já tem admin, fazer `curl -X POST http://localhost:3000/api/seed-first-admin -H "Content-Type: application/json" -d '<body apropriado conforme estrutura lida no passo 1>'` retorna 403
- [ ] (Não há como testar o caminho positivo sem zerar o banco — não fazer)

### Commit ao final da Tarefa B

```
fix(security): adiciona guard no seed-first-admin

- Bloqueia rota com 403 quando ja existe admin
- console.warn ao bloquear (audit minimo)
- Corpo neutro ("Operacao nao permitida") sem revelar motivo
```

---

## Tarefa C — Trocar `bg-blue-50` por tokens (~15min)

### Contexto / decisões já tomadas

- **Escopo restrito:** apenas `bg-blue-50`. Outras cores hardcoded (`bg-blue-*`, `text-blue-*`, hex direto) **NÃO** entram nesta sessão — viram item de backlog pra varredura geral futura.
- **Tokens candidatos** (escolher por contexto visual de cada ocorrência):
  - `bg-primary/10` — destaque sutil de marca
  - `bg-muted` — fundo neutro/secundário
  - `bg-accent` — hover/realce
- **Workflow obrigatório:** **lista primeiro, espera meu OK, depois aplica.**

### Implementação esperada

1. Rodar `grep -rn "bg-blue-50" --include="*.tsx" --include="*.ts" --include="*.css"` na raiz do projeto.

2. **Calibrar workflow conforme número de ocorrências:**
   - **Se 1 ou 2 ocorrências:** simplifica. Descreve em texto corrido (não tabela) — "arquivo X linha Y é Z, vou trocar por W". Espera meu OK rápido e aplica.
   - **Se 3 ou 4 ocorrências:** mantém o workflow de tabela formal abaixo.
   - **Se 5+ ocorrências:** **PARA e me avisa antes de propor**. Pode ser sinal de que essa cor virou "regra implícita" (tipo highlight de algo específico que aparece em vários lugares) e vale discutir antes de trocar tudo de uma vez.

3. Pra cada ocorrência (no caso de tabela formal), abrir o arquivo, identificar o contexto visual (o que aquele div/elemento representa) e propor um token. Apresentar pra mim a tabela neste formato:

   | Arquivo:linha | Contexto visual | Token proposto |
   |---|---|---|
   | `app/foo/bar.tsx:42` | Card de destaque do booking PENDING | `bg-primary/10` |
   | ... | ... | ... |

4. **Esperar meu OK** antes de aplicar. Se eu pedir alteração em algum item, ajustar e reapresentar.

5. Aplicar as substituições de uma vez só.

### DoD da Tarefa C

- [ ] Workflow correto seguido conforme número de ocorrências
- [ ] Proposta apresentada e aprovada por mim antes da aplicação
- [ ] `pnpm lint` passa
- [ ] `pnpm build` passa
- [ ] `grep -rn "bg-blue-50"` retorna **zero** ocorrências
- [ ] Verificação visual rápida (já com dev server rodando): páginas afetadas continuam coerentes em light + dark mode

### Commit ao final da Tarefa C

```
fix(ui): troca bg-blue-50 hardcoded por tokens

- Todas ocorrencias substituidas por tokens do projeto (bg-primary/10, bg-muted, bg-accent)
- Sem hardcode de cor azul restante
```

---

## Tarefa D — Atualizar `CLAUDE.md` (~5-10min)

### Contexto / decisões já tomadas

- **Localizar por termo, não por número.** Os índices das listas no `CLAUDE.md` mudam, então procurar pelos termos abaixo:
  - `seed-first-admin` (na seção "Gotchas conhecidos")
  - `LGPD` (na seção "Lacunas conhecidas")
  - `bg-blue-50` (se mencionado em alguma seção — pode estar nas Lacunas; se não estiver, ignora)
- **Histórico de decisões importa.** Não remover itens resolvidos — marcar como resolvidos.

### Implementação esperada

Pra cada item a editar, **mostrar pra mim o trecho ANTES e DEPOIS** antes de salvar. Formato:

```
### CLAUDE.md — edição 1: seed-first-admin

ANTES:
> [linha original]

DEPOIS:
> [linha nova]
```

Edições propostas:

1. **Gotchas → seed-first-admin**: o item atual diz "rota pública sem checagem". Atualizar pra refletir que agora tem guard e que a rota só serve pra bootstrap em banco vazio.

2. **Lacunas conhecidas → LGPD**: **NÃO remover.** Marcar como resolvido. Duas opções (escolher a que ficar mais limpa no contexto do `CLAUDE.md` atual):
   - **(a)** Adicionar prefixo `✅ RESOLVIDO (Sessão 1):` antes do título do item, mantendo o conteúdo descritivo abaixo (vira nota histórica).
   - **(b)** Mover o item inteiro pra uma seção nova "Lacunas resolvidas" no fim do arquivo.

   Mostrar pra mim qual escolheu e por quê antes de aplicar.

3. **Lacunas conhecidas → bg-blue-50**: se existir referência, marcar como resolvido seguindo a mesma opção escolhida em (2). Se não existir, ignorar.

Esperar meu OK em cada edição antes de aplicar a próxima.

### DoD da Tarefa D

- [ ] Trechos antes/depois mostrados pra mim e aprovados
- [ ] Decisão entre opção (a) e (b) reportada e justificada
- [ ] `git diff CLAUDE.md` mostra apenas as edições aprovadas
- [ ] Nenhuma edição estrutural não solicitada (não mexer em outras seções)

### Commit ao final da Tarefa D

```
docs: atualiza CLAUDE.md apos fixes da Sessao 1

- Gotcha do seed-first-admin atualizado para refletir guard
- Item LGPD marcado como resolvido nas Lacunas conhecidas
```

---

## Definição de pronto global (Sessão 1 inteira)

- [ ] 4 commits na branch `claude/sessao-1-quick-wins-qualidade`, na ordem A → B → C → D
- [ ] `pnpm lint` passa
- [ ] `pnpm build` passa
- [ ] Validação manual de payload (Tarefa A) **executada e reportada**, incluindo o teste extra com admin
- [ ] PR criado contra `main` com descrição listando: o que cada commit resolve, screenshot/print da validação de payload, linha da tabela final de tokens da Tarefa C
- [ ] Listar pra mim os arquivos criados/modificados ao final, agrupados por tarefa

---

## Time-box

**1h30 total.** Distribuição:

- Tarefa A (LGPD): ~1h (incluindo validação manual)
- Tarefa B (seed): ~15min
- Tarefa C (bg-blue-50): ~15min
- Tarefa D (CLAUDE.md): ~5-10min

**Se Tarefa A estourar pra 1h30:** parar, commitar A, abrir PR só com A, e B/C/D viram outra sessão. **Nunca pular A pra começar B ou C.**

**Se A terminar em 45min:** ótimo, sobra folga pras outras.

---

## Antes de começar — checklist

Confirmar comigo (usuário) antes de codar a Tarefa A:

1. [ ] `main` local está sincronizada com `origin/main` (PR #2 já mergeado)
2. [ ] Pré-requisito P.2 executado e resultado da query mostrado
3. [ ] Estrutura do body atual de `seed-first-admin/route.ts` reportada (1 linha)
4. [ ] OK pra criar a branch `claude/sessao-1-quick-wins-qualidade` e começar pela Tarefa A

Não começar codar nada antes de eu confirmar os 4 itens acima.