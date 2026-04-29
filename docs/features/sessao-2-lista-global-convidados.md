Sessão 2 — Lista Global de Convidados (CRUD)
Objetivo
Permitir que admin gerencie uma lista de emails que serão sempre adicionados como convidados em todo evento aprovado. Esta sessão só implementa o CRUD — o uso real desses emails (ao criar evento no Google Calendar) vem na Sessão 3.
Time-box
2-3h. Se algo travar (ex: npx shadcn add alert-dialog falhar, migration der conflito, comportamento inesperado do revalidatePath), parar e avisar antes de improvisar.
Contexto de produto
Da visao-de-produto.md, etapa 4 do fluxo: ao aprovar um booking, o sistema cria evento no Google Calendar e adiciona convidados, incluindo "lista global configurável de emails que sempre recebem convite". Esta feature é o gerenciamento dessa lista.
Caso de uso real: ~2 emails iniciais (recepção do Inteli + substituta), com flexibilidade pra adicionar/remover no futuro.
Escopo
1. Schema (Prisma)
Adicionar modelo em prisma/schema.prisma:
prismamodel GlobalGuestEmail {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
Migration: npx prisma migrate dev --name add_global_guest_email seguido de npx prisma generate.
2. Schema Zod
Criar lib/schemas/global-guest-email.ts:
tsimport { z } from "zod/v3";

export const createGlobalGuestEmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type CreateGlobalGuestEmailInput = z.infer<typeof createGlobalGuestEmailSchema>;
3. Server actions
Criar server/global-guest-email.ts com 3 actions, todas admin-only (usando o helper isAdmin() que já existe):

listGlobalGuestEmails() → retorna lista ordenada por createdAt desc. Não retorna { success, error } — esta é leitura, retorna o array direto (seguir padrão de getBookingsByMonth).
createGlobalGuestEmail(input) → valida com Zod. Se email já existe (P2002 do Prisma), retorna { success: false, error: "Esse email já está cadastrado." }. Em sucesso, revalidatePath("/z_admin").
deleteGlobalGuestEmail(id) → deleta por id. Em sucesso, revalidatePath("/z_admin").

Padrão de retorno em mutações: { success: true } | { success: false, error: string }. Mensagens em pt-BR. Erros logados via console.error no servidor.
Comportamento de revalidação: após createGlobalGuestEmail e deleteGlobalGuestEmail darem sucesso, revalidatePath("/z_admin") é chamado. O componente client NÃO faz refetch manual — confia na revalidação do Next.
4. Componente shadcn novo
Instalar AlertDialog (que ainda não existe no projeto):
bashnpx shadcn add alert-dialog
Usar só na nova feature — não refatorar os confirm() nativos existentes em admin-calendar.tsx:126 e user-list.tsx:121 nesta sessão (housekeeping pra depois, vai virar item nas Lacunas Conhecidas do CLAUDE.md).
5. UI — nova tab "Convidados globais"
Em app/(admin)/z_admin/page.tsx:

Estender o tipo: type Tab = "calendar" | "users" | "global-guests"
Adicionar terceiro <Button> no header de tabs com ícone Mail do lucide-react, label "Convidados globais"
Adicionar bloco condicional {tab === "global-guests" && <GlobalGuestList />}
Importante: os outros dois Buttons hoje têm bug sutil — o do "Usuários" usa variant={tab === "calendar" ? "ghost" : "default"}, que só funciona porque há 2 tabs. Ao adicionar a 3ª, mudar todos para variant={tab === "X" ? "default" : "ghost"} (consistência).

Criar app/(admin)/z_admin/_components/global-guest-list.tsx (client component) com:
Form de adicionar (sempre visível no topo, mesmo com lista vazia):

Input de email + botão "Adicionar"
React Hook Form + Zod (createGlobalGuestEmailSchema)
Input desabilitado durante submit (via useTransition ou loading state)
Botão "Adicionar" mostra estado de loading durante o submit
Em sucesso: toast.success("Email adicionado") + form.reset()
Em erro de duplicação (vindo do server): toast.error(result.error)
Em erro de validação Zod (formato inválido): mensagem fica abaixo do input via FormMessage do shadcn — não toast (esse é erro de form, não de submit)

Lista de emails (ordenada do mais recente):

Cada item mostra o email + botão "X" (ícone Trash2 do lucide)
Clique no botão abre AlertDialog

Empty state quando lista vazia:

Form de adicionar continua visível no topo
Mensagem "Nenhum email cadastrado. Adicione o primeiro acima." aparece no lugar onde a lista apareceria, em text-muted-foreground

Confirmação de exclusão via AlertDialog:

Título: "Remover email?"
Descrição: O email "{email}" não receberá mais convites automáticos.
Cancelar / Remover (botão Remover com variant="destructive")
Em confirmação: chama deleteGlobalGuestEmail(id), toast "Email removido."

6. Tipos
Tipo do email no client é inferido da action (padrão do projeto):
tstype GlobalGuestEmail = Awaited<ReturnType<typeof listGlobalGuestEmails>>[number];
7. Tokens / estilo

Tudo com tokens Tailwind (bg-card, border-border, text-muted-foreground, etc.) — nunca hex.
Variantes dark: quando relevante.
Strings em pt-BR.

Fora de escopo (NÃO fazer)

Não usar a lista em nenhum fluxo de aprovação ainda — Sessão 3.
Não validar domínio (@inteli.edu.br etc.).
Não adicionar campos extras (apelido, função, ordem custom, soft delete).
Não refatorar os window.confirm() legados em admin-calendar e user-list.
Não adicionar paginação ou busca (lista terá ~2 itens).
Não adicionar testes (projeto ainda não tem suite).

Critérios de aceite

 Migration aplicada, GlobalGuestEmail existe no banco.
 Admin acessa /z_admin, clica em nova tab "Convidados globais".
 Adiciona um email válido → aparece na lista (no topo, ordem createdAt desc).
 Tenta adicionar email duplicado → toast.error com mensagem amigável, lista não muda.
 Tenta adicionar email com formato inválido → mensagem via FormMessage abaixo do input (não toast).
 Input e botão "Adicionar" mostram estado de loading durante submit.
 Clica "X" num email → AlertDialog abre, confirma → email some da lista.
 Lista vazia mostra empty state, mas form de adicionar continua visível.
 User comum não consegue acessar a tela: /z_admin já é protegido pelo layout app/(admin)/layout.tsx — confirmar que esse comportamento se mantém (acessar como user comum redireciona pra /dashboard).
 Server actions têm guard isAdmin() (defesa em profundidade, além do layout).
 Tudo em pt-BR, com tokens Tailwind, suporta dark mode.
 CLAUDE.md atualizado com novo modelo + nota sobre confirm() legados.

Arquivos esperados
Criar:

prisma/migrations/<timestamp>_add_global_guest_email/migration.sql
lib/schemas/global-guest-email.ts
server/global-guest-email.ts
app/(admin)/z_admin/_components/global-guest-list.tsx
components/ui/alert-dialog.tsx (via npx shadcn add)

Modificar:

prisma/schema.prisma (adicionar modelo)
app/(admin)/z_admin/page.tsx (adicionar tab + corrigir variant lógica dos botões)
CLAUDE.md:

Atualizar seção "Modelos (Prisma)" para incluir GlobalGuestEmail
Remover/atualizar referências em "Lacunas conhecidas" e "Gotchas" que mencionam GlobalGuestEmail como "Fase 4 / planejado"
Adicionar item nas "Lacunas conhecidas": "Refatorar window.confirm() legados em admin-calendar.tsx:126 e user-list.tsx:121 para AlertDialog do shadcn (consistência com a Sessão 2)"