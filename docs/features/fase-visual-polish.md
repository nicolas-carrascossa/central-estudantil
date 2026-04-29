# Sessão: Polimento visual rápido (pré-reunião)

Sessão **TIME-BOXED em 1-2 horas**. Reunião com a Central Estudantil hoje, queremos mostrar evolução visual. NÃO é refactor profundo — é polimento cirúrgico.

## Filosofia desta sessão

- **Mudanças visuais SEM tocar em lógica.** Não mexer em server actions, schema, validações, fluxos.
- **Reaproveitar tokens do projeto** (`bg-primary`, `text-primary-foreground`, etc — cor primária navy `oklch(0.3049 0.0934 259.1593)`).
- **Não introduzir libs novas.** Usar apenas o que já existe (Tailwind v4, shadcn já instalados, lucide-react).
- **Mobile responsivo mantido.** Não quebrar o que já funciona em mobile.
- **Tema dark já existe via next-themes** — qualquer mudança deve ter variantes `dark:` quando faz sentido.
- Se uma mudança parecer arriscada (tipo refazer estrutura de componente), PARA e me avisa. Prefere mudança menor que funcione a mudança grande que pode quebrar.

## Ordem estrita das prioridades

Faça em ordem. Se tempo acabar, pula o resto. Não pula prioridade A pra começar pela C.

---

## Prioridade A — Login redesenhado (~45min)

**Arquivo principal:** `app/(auth)/login/_components/login-form.tsx` (e o `page.tsx` se necessário).

**Objetivo:** transformar a página de login num layout mais elegante e profissional.

**Decisão de design:** escolha UMA das duas abordagens (a que for mais rápida e segura no código atual):

### Abordagem 1: Split-screen

- Tela dividida ao meio
- Lado esquerdo (50%, escondido em mobile): cor primária `bg-primary` com:
  - Logo/texto "Central Estudantil" em destaque (texto grande, branco, fonte bold)
  - Tagline: "Reserve espaços para eventos do seu clube"
  - Pequeno texto descritivo ou ícones ilustrativos (usar lucide-react: Calendar, Users, MapPin, etc)
- Lado direito (50% desktop, 100% mobile): form de login centralizado verticalmente, com:
  - Heading "Entrar" ou "Bem-vindo de volta"
  - Subtítulo curto
  - Form atual (não mexer na lógica)
  - Espaçamento generoso

### Abordagem 2: Card centralizado polido

- Background da página com gradiente sutil ou cor `bg-muted`
- Card centralizado (max-w-md), com:
  - Topo do card: faixa com cor primária `bg-primary` contendo "Central Estudantil"
  - Corpo do card: form de login com mais respiro
  - Tipografia hierarquizada
  - Sombra mais elegante (`shadow-xl` ou `shadow-2xl`)

**Antes de codar, me diga qual abordagem escolheu e por quê.** Espera meu OK.

**Restrições:**

- NÃO mexer na lógica de autenticação (server action `signIn`, fluxo de callback)
- Inputs continuam usando os componentes shadcn existentes (`Input`, `Label`, `Button`, etc)
- Mensagens de erro mantêm o sistema atual (Sonner toasts)
- Strings em pt-BR

---

## Prioridade B — Calendário polido (~30min)

**Arquivos:** `app/(protected)/dashboard/_components/calendar.tsx` e `app/(admin)/z_admin/_components/admin-calendar.tsx`.

**Objetivo:** deixar o calendário visualmente mais profissional sem mexer na lógica.

**Mudanças específicas (em ordem de prioridade dentro da prioridade B):**

### B.1 — Cores de status mais sofisticadas

Hoje provavelmente está com cores chapadas. Mudar para:

- **PENDING:** `bg-amber-50 text-amber-900 border-amber-200` (light) / `dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900`
- **APPROVED:** `bg-emerald-50 text-emerald-900 border-emerald-200` / `dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-900`
- **CANCELLED:** `bg-rose-50 text-rose-900 border-rose-200` / `dark:bg-rose-950 dark:text-rose-100 dark:border-rose-900`
- Adicionar borda esquerda mais grossa (`border-l-4`) com a cor mais saturada do mesmo tom (amber-500, emerald-500, rose-500) — dá um destaque elegante

### B.2 — Tipografia dos cards de booking

- Título: `text-sm font-medium` (ou `font-semibold`)
- Horário: `text-xs text-muted-foreground` ou similar
- Espaçamento interno: `px-2 py-1.5` (ajustar conforme necessário)
- Bordas mais suaves: `rounded-md` em vez de `rounded` ou `rounded-sm`

### B.3 — Hover state nos bookings

- Adicionar `hover:shadow-sm transition-shadow duration-150` ou similar
- Cursor pointer (já deve ter, mas confirmar)

### B.4 — Dia "Hoje" destacado de forma elegante

Hoje provavelmente tem algum destaque básico. Melhorar para:

- Borda superior em `border-t-2 border-primary` no dia atual
- Ou número do dia em círculo com `bg-primary text-primary-foreground rounded-full`
- Escolher um (não os dois)

### B.5 — Dias de outros meses com opacidade

Se já não tem, adicionar `opacity-40` ou `text-muted-foreground` nos dias do mês anterior/próximo que aparecem na grid.

### B.6 — Espaçamento geral da grid

- Garantir `gap-2` ou similar entre células
- Padding consistente nas células (`p-2`)

**Restrições:**

- NÃO mexer na lógica de filtragem, modal, status changes
- Manter responsividade (mobile = visão semanal, desktop = mês)
- Todas as mudanças em ambos os calendários (user e admin) pra consistência

---

## Prioridade C — Header com identidade (~20min, OPCIONAL)

**SÓ FAZ SE PRIORIDADES A E B ESTIVEREM PRONTAS E TIVER PELO MENOS 20 MINUTOS DE FOLGA.**

**Arquivo:** procurar onde fica o header/nav nos layouts. Provavelmente em `app/(protected)/layout.tsx` e `app/(admin)/layout.tsx` ou em componentes separados.

**Mudanças:**

- Esquerda: logo/texto "Central Estudantil" com tipografia bold, cor `text-primary`
- Direita: nome do usuário logado + avatar (pode usar inicial do nome em círculo se não tiver imagem)
- Para admin: badge "Admin" ao lado do nome (`bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded`)
- Botão de logout discreto (ícone `LogOut` do lucide-react)
- Border-bottom sutil no header (`border-b border-border`)

**Restrições:**

- Não introduzir biblioteca de avatar (se já tem `Avatar` do shadcn instalado, usar; senão, fallback simples com inicial)
- NÃO mexer em rotas, sessão, layout fundamental
- Se não tiver tempo de fazer direito, NÃO FAZER. Header meio feito é pior que header básico atual.

---

## Definição de pronto

- `pnpm lint` (ou `npm run lint`) passa
- `pnpm build` (ou `npm run build`) passa
- Login mostra a nova versão (qualquer abordagem aprovada)
- Calendário do usuário e do admin com cores de status novas, tipografia melhorada
- Mobile continua funcionando
- Tema dark continua coerente
- Header novo (se prioridade C foi feita)

## Commits sugeridos

1. `feat(login): redesigna pagina de login com [abordagem escolhida]`
2. `feat(calendar): polimento visual com cores de status e tipografia melhorada`
3. `feat(header): adiciona identidade visual no header` (se C foi feito)

## Branch

Você já está em `claude/visual-polish` (criada a partir da `main` que tem a Fase 1+2 mergeada via PR #1). Não criar branch nova.

## Time-boxing

**SE PASSAR DE 2 HORAS, PARA.** Não importa em que prioridade está. Commita o que tem pronto e me avisa que o tempo acabou. Reunião é hoje, não vale a pena entregar incompleto e quebrado.

## Antes de começar

Confirma:

1. Está em `claude/visual-polish` com working tree limpo (já confirmado pelo usuário)
2. Qual abordagem escolheu para login (1 split-screen ou 2 card centralizado)
3. Espera meu OK antes de codar
