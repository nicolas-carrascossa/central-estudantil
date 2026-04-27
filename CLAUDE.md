# Central Estudantil (ce-platform)

Plataforma web em **português (pt-BR)** para alunos do Inteli reservarem espaços (auditório, salas de reunião, coworking, laboratório, sala de eventos) para eventos de clubes estudantis. Admins (Central Estudantil) revisam e aprovam/cancelam pedidos.

> **Estado atual:** projeto em desenvolvimento. UI funcional para fluxo de criação/aprovação/exclusão. Várias lacunas conhecidas listadas no final deste documento.

---

## Stack obrigatória — não trocar nada disso sem combinar antes

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript estrito**
  - `tsconfig.json` paths: `@/*` → raiz do projeto
- **Tailwind v4** + **shadcn/ui** style `radix-vega` ([components.json](components.json))
- Ícones via `lucide-react`
- **Prisma 7** + Postgres via `@prisma/adapter-pg`
  - Cliente gerado em `lib/generated/prisma` (rodar `npx prisma generate` se não existir)
  - Schema em [prisma/schema.prisma](prisma/schema.prisma), config em [prisma.config.ts](prisma.config.ts)
- **better-auth 1.5** com plugins `admin` + `nextCookies`
  - Server: [lib/auth.ts](lib/auth.ts) — Client: [lib/auth-client.ts](lib/auth-client.ts)
  - Roles: `"user"` e `"admin"` (string em `User.role`)
- **React Hook Form** + **Zod** (`zod/v3`)
- **Sonner** para toasts (Toaster montado em [app/layout.tsx](app/layout.tsx))
- **date-fns** com locale `ptBR`
- Validação de env via `@t3-oss/env-nextjs` em [lib/env.ts](lib/env.ts)
  - `DATABASE_URL` (obrigatório), `BETTER_AUTH_SECRET` (obrigatório), `BETTER_AUTH_URL` (opcional)
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SECRETARIA_EMAIL` — todos obrigatórios
  - Não usar `process.env.X` direto no app — sempre importar `env` de [lib/env.ts](lib/env.ts)
- **Resend** + **React Email** (`@react-email/components`) para e-mails transacionais
  - Cliente em [lib/email.ts](lib/email.ts), templates em [emails/](emails)
  - Atualmente em sandbox (`onboarding@resend.dev`); produção exige verificar domínio próprio no Resend

---

## Segurança

- **Nunca imprimir conteúdo de `.env*`** ou outros arquivos com credenciais (`.vscode/settings.json` com env vars embutidas, qualquer `*.local.json`) no chat. Pra confirmar existência, usar `Test-Path` (Windows) ou checagem equivalente sem ler o conteúdo.
- **Nunca commitar credenciais.** `.env*` já está no `.gitignore` — validar com `git check-ignore -v <arquivo>` antes de adicionar qualquer arquivo de config.
- Se precisar do valor de uma variável de ambiente, **pedir pro usuário confirmar fora do chat**.

---

## Convenções de código (seguir religiosamente)

### Server Actions
- Arquivos em `server/*.ts` com `"use server"` no topo da primeira linha.
- Toda action começa pegando session: `const session = await auth.api.getSession({ headers: await headers() })`.
- Actions de admin checam `session.user.role === "admin"` via helper `isAdmin()` (ver [server/booking-admin.ts](server/booking-admin.ts) e [server/user-admin.ts](server/user-admin.ts)).
- Retorno padrão: `{ success: true } | { success: false, error: string }` — **NUNCA throw**. Erros vão para `console.error` no servidor e mensagem amigável em pt-BR no `error`.
- Após mutação, chamar `revalidatePath("/dashboard")` e/ou `revalidatePath("/z_admin")` conforme o que foi alterado.

### Estrutura de rotas (route groups)
- `app/(auth)/` — público
  - `login/` — form em [app/(auth)/login/_components/login-form.tsx](app/(auth)/login/_components/login-form.tsx)
  - `callback/` — server component checa role e redireciona via `AuthCallbackClient` (`window.location.replace`)
- `app/(protected)/` — exige sessão; layout em [app/(protected)/layout.tsx](app/(protected)/layout.tsx) redireciona para `/login` se não tiver
  - `dashboard/` — calendário do usuário
- `app/(admin)/` — exige `role === "admin"`; layout em [app/(admin)/layout.tsx](app/(admin)/layout.tsx) redireciona admin-faltante para `/dashboard`
  - `z_admin/` — painel admin (calendário + gerenciamento de usuários, com tabs)
- `app/api/seed-first-admin/route.ts` — POST público para bootstrap do primeiro admin (ver "Gotchas")

### Componentes
- Componentes client de uma rota ficam em `_components/` adjacente ao `page.tsx`.
- Componentes shadcn vivem em [components/ui](components/ui). Já existem: `button`, `card`, `dialog`, `field`, `input`, `label`, `password-input`, `select`, `separator`, `sonner`, `theme-provider`.
- Antes de criar um componente novo, conferir se shadcn já tem; adicionar via `npx shadcn add <comp>` no estilo `radix-vega`.
- Helper `cn()` em [lib/utils.ts](lib/utils.ts) para mesclar classes.

### Estilo
- Cor primária: azul-marinho (`oklch(0.3049 0.0934 259.1593)` em [app/globals.css](app/globals.css)).
- **Sempre** usar tokens Tailwind (`bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`, etc.) — **nunca** hex direto.
- Status: amarelo = `PENDING`, verde = `APPROVED`, vermelho = `CANCELLED`.
- Suporte a tema dark já configurado via `next-themes` (`ThemeProvider` em [app/layout.tsx](app/layout.tsx)) — incluir variantes `dark:` quando relevante.

### i18n
- Toda string visível ao usuário em **português brasileiro**. Mensagens de erro também.
- Datas formatadas com `format(d, "...", { locale: ptBR })`.

### Schemas Zod
- Ficam em [lib/schemas/](lib/schemas) e são reutilizados client + server.
- Usar `zod/v3` (não `zod` puro) — todo o código existente importa de `"zod/v3"`.
- Tipos exportados via `z.infer<typeof schema>`.

### Tipos derivados
- O tipo de `Booking` no client é inferido das actions:
  ```ts
  type BookingFromDb = Awaited<ReturnType<typeof getBookingsByMonth>>[number];
  ```
  Ver [calendar.tsx:65](app/(protected)/dashboard/_components/calendar.tsx:65). Replicar esse padrão para evitar duplicação de tipos.

---

## Modelos (Prisma)

Ver [prisma/schema.prisma](prisma/schema.prisma).

- **`User`** (better-auth): `id`, `name`, `email` (unique), `emailVerified`, `image`, `role: String?` (`"user" | "admin"`), `banned/banReason/banExpires`, `createdAt/updatedAt`. Relações: `sessions`, `accounts`, `bookings`.
- **`Session`**, **`Account`**, **`Verification`** — gerenciados pelo better-auth.
- **`Booking`**:
  - `id` (cuid), `title`, `date` (DateTime, dia do evento)
  - `startTime`, `endTime` — strings `HH:mm`
  - `spaceFirstOption`, `spaceSecondOption` — slugs do espaço (1ª e 2ª escolha do usuário)
  - `externalGuests` — Json: `[{ name: string, cpf: string }]`
  - `clubEmail`, `representativeEmail`
  - `status` — enum `BookingStatus` (`PENDING | APPROVED | CANCELLED`), default `PENDING`
  - `createdById` → User (cascade delete), `createdAt`, `updatedAt`
  - Índices em `date` e `createdById`
- Para alterar schema: `npx prisma migrate dev --name <descrição>` (vai criar migration em `prisma/migrations/` e regenerar o client).

---

## Espaços disponíveis (atenção: hoje duplicado e divergente)

Lista hard-coded em **dois** lugares com valores diferentes:
- [calendar.tsx:54](app/(protected)/dashboard/_components/calendar.tsx:54): `auditorio`, `m01`, `sala-reuniao-2`, `sala-coworking`, `laboratorio`, `sala-eventos`
- [admin-calendar.tsx:47](app/(admin)/z_admin/_components/admin-calendar.tsx:47): `auditorio`, `sala-reuniao-1`, `sala-reuniao-2`, `sala-coworking`, `laboratorio`, `sala-eventos`

Ao mexer em qualquer fluxo de espaços, **unificar em `lib/constants/spaces.ts`** exportando `SPACE_OPTIONS: { value: string; label: string }[]` e usar dos dois lados. Se o admin precisar editar, virar tabela no Prisma.

---

## Fluxos importantes

### Login
1. Usuário entra em `/login` → submit chama server action `signIn` em [server/auth.ts](server/auth.ts).
2. Em sucesso: `window.location.href = "callback"` (não usar `router.push` aqui — esse hard-redirect garante que o cookie de sessão se propague).
3. `/callback` é server component que lê a sessão, calcula `destination` (`/z_admin` se admin, `/dashboard` se user) e renderiza `AuthCallbackClient` que faz `window.location.replace(destination)`.
4. Não inventar atalhos no fluxo — esse pingue-pongue está intencional.

### Booking — usuário comum
1. No calendário, clicar num dia (futuro) abre o modal "Solicitar agendamento".
2. Form em [calendar.tsx](app/(protected)/dashboard/_components/calendar.tsx) coleta título, horários, 1ª/2ª opção de espaço, convidados externos (nome+CPF), email do clube e do representante.
3. `createBooking` ([server/booking.ts](server/booking.ts)) valida com `createBookingSchema`, rejeita data passada, salva com `status: PENDING` e `createdById = session.user.id`.
4. `getBookingsByMonth` retorna os bookings do mês: **próprios do usuário OR qualquer outro com `status = APPROVED`** (linha 19).

### Booking — admin
- `/z_admin` mostra **todos** os bookings via `adminGetBookingsByMonth`.
- Admin pode mudar status via `adminUpdateBookingStatus` ou deletar via `adminDeleteBooking`.
- Mostra solicitante, contatos e convidados externos no modal de detalhes.

### Gerenciamento de usuários (admin)
- Lista, edita (nome/email/role), redefine senha, cria, deleta — tudo via [server/user-admin.ts](server/user-admin.ts) usando as APIs do plugin `admin` do better-auth.
- `adminListUsers` tem `limit: 100` hard-coded, sem paginação ou busca.

---

## Gotchas conhecidos

- **`api/seed-first-admin/route.ts` é POST público sem checagem de "já existe admin"** — qualquer um pode criar admin. Só usar pro primeiro setup. Se for tocar, adicionar guard checando se já há admin no banco.
- `lib/db.ts` usa singleton via `globalThis` para evitar várias conexões em dev — manter o padrão.
- `lib/generated/prisma` não está no git (está no `.gitignore`); rodar `npx prisma generate` antes do primeiro `dev`/`build`.
- Em [calendar.tsx](app/(protected)/dashboard/_components/calendar.tsx) o filtro de bookings exclui `CANCELLED` para outros usuários, mas o usuário também não vê os próprios cancelados na visão atual (porque a action retorna tudo) — confirmar comportamento desejado antes de mexer.
- Mobile mostra **só visão semanal** (em coluna), desktop mostra mês completo. Comportamento responsivo via `md:` breakpoint.
- O calendário admin tem layout idêntico ao do usuário com modal extra de ações — manter consistência.
- `BETTER_AUTH_URL` opcional: se setado, é adicionado a `trustedOrigins`. `localhost:3000` e `127.0.0.1:3000` já estão por default.
- E-mail (Resend) usa `SECRETARIA_EMAIL` como destinatário único do `NewBookingRequestEmail` — deveria ser uma lista global gerenciável (modelo `GlobalGuestEmail`, planejado pra Fase 4 do roadmap).

---

## Lacunas conhecidas (candidatos a features)

1. `SPACE_OPTIONS` duplicado e divergente entre user e admin (ver acima).
2. **Sem detecção de conflito** — o mesmo espaço pode ser aprovado em horários sobrepostos no mesmo dia.
3. **Aprovação não registra qual espaço ficou** — não há campo `approvedSpace`; admin aprova mas não diz se foi a 1ª ou 2ª opção.
4. **Email implementado parcialmente** — Resend ativo via sandbox (`onboarding@resend.dev`); falta verificar domínio próprio no Resend pra produção e migrar `SECRETARIA_EMAIL` pra lista global (planejado pra Fase 4).
5. **Sem editar booking** — usuário só cria, muda status ou deleta.
6. **Sem reset de senha** / esqueci minha senha.
7. **`adminListUsers` sem paginação/busca** (limite 100 fixo).
8. Usuário comum não tem **histórico** dedicado (só vê o mês corrente do calendário).
9. **Sem testes**.
10. README ainda é o boilerplate do `create-next-app` — substituir.
11. Mobile não tem visão de mês.

---

## Comandos

```bash
pnpm dev                                  # dev server (Next 16 + Turbopack)
pnpm build && pnpm start                  # produção
pnpm lint                                 # ESLint

npx prisma generate                       # regenerar client (rodar após mudar schema ou no primeiro setup)
npx prisma migrate dev --name <descricao> # criar migration em dev
npx prisma studio                         # GUI do banco
```

---

## Como propor uma nova feature

Para cada feature pedida em arquivos `feature*.md`:

1. **Schema** — se precisar mexer no Prisma: editar `schema.prisma`, criar migration com nome descritivo, regenerar client.
2. **Validação** — adicionar/atualizar schema Zod em `lib/schemas/`.
3. **Server action** — em `server/`, com guard de auth (e role se admin-only), retorno `{ success, error? }`, `revalidatePath` ao final.
4. **UI** — em `_components/` da rota relevante, reutilizando shadcn existente. Strings em pt-BR. Toasts via `sonner`.
5. **Constantes compartilhadas** — extrair para `lib/constants/` se forem usadas em mais de um lugar (ex: lista de espaços).
6. Não introduzir libs novas sem avisar.
