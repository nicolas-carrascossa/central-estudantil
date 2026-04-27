# Sessão: Fase 1 + 2 — Migrations e UI de detalhes para clube

Estamos implementando melhorias no ce-platform. Já mapeamos lacunas e decidimos um plano em fases. Esta sessão cobre **Fase 1 (schema/migrations)** e **Fase 2 (modal de detalhes pro clube)**. Não mexe em email nem Google Calendar ainda.

## Contexto importante (já confirmado com o usuário)

- Usuário comum em `getBookingsByMonth` JÁ vê todos APPROVED de outros + todos os próprios. Filtro está correto, problema era só UI.
- LGPD: usuário comum NÃO pode ver CPF/email de contato/nomes de convidados de bookings de outros clubes — só dos próprios.
- `SPACE_OPTIONS` está duplicado e divergente entre `calendar.tsx:54` e `admin-calendar.tsx:47` — vamos unificar agora.
- Booking não tem `description`, `approvedSpace`, nem `importedFromSpreadsheet` — adicionar todos numa migration só.
- `externalGuests` é Json `[{name, cpf}]` — vai virar `[{name, cpf, email}]` (email opcional pra não quebrar bookings antigos).
- Modelo novo: `GlobalGuestEmail` (entra na Fase 4, NÃO nesta sessão — só deixar nota).

## Fase 1 — Schema e constantes

### 1.1 Unificar SPACE_OPTIONS

Criar `lib/constants/spaces.ts` exportando:

```ts
export const SPACE_OPTIONS = [
  { value: "...", label: "..." },
  // ...
] as const;

export type SpaceValue = (typeof SPACE_OPTIONS)[number]["value"];

export function getSpaceLabel(value: string): string {
  return SPACE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}
```

Decidir os valores corretos olhando os 2 arquivos atuais (`calendar.tsx:54` e `admin-calendar.tsx:47`). Use os labels mais completos/em português. Listar pra mim os valores escolhidos antes de seguir caso haja conflito real entre os dois.

Substituir os imports nos dois calendários e em qualquer outro lugar que use a constante local.

### 1.2 Migration: campos novos no Booking

Adicionar ao `model Booking` em `prisma/schema.prisma`:

- `description String?` — descrição/observação do evento
- `approvedSpace String?` — qual das duas opções foi aprovada (preenchido só quando status vira APPROVED)
- `importedFromSpreadsheet Boolean @default(false)` — pra futura importação da planilha da secretaria

Rodar `npx prisma migrate dev --name add_booking_details_and_approved_space` e `npx prisma generate`.

### 1.3 Atualizar schema Zod do Booking

Em `lib/schemas/booking.ts`:

- Adicionar `description: z.string().max(2000).optional()` no schema de criação
- Atualizar `externalGuestSchema` pra incluir `email: z.string().email("Email inválido").optional()` (opcional pra não quebrar dados antigos no banco)

### 1.4 Atualizar form de criação de booking

No `calendar.tsx` do clube (modal de criar booking):

- Adicionar campo `<Textarea>` pra `description` (instalar via `npx shadcn add textarea` se não tiver)
- Adicionar input de `email` na linha de cada convidado externo (ao lado de nome e CPF)
- Atualizar `addExternalGuest` e `updateExternalGuest` em `calendar.tsx:141-164` pra incluir email

### 1.5 Server action de aprovação aceita approvedSpace

Em `server/booking-admin.ts`, a action que aprova booking deve receber `approvedSpace` como argumento e salvar no banco. Validar que `approvedSpace` é igual a `spaceFirstOption` ou `spaceSecondOption` do booking. Se não for, retornar `{ success: false, error: "Espaço aprovado deve ser uma das opções solicitadas" }`.

### 1.6 UI de aprovação no admin

No modal de detalhes do admin (`admin-calendar.tsx:374-501`), antes do botão "Aprovar":

- Mostrar um `<Select>` com as 2 opções (`spaceFirstOption` e `spaceSecondOption`) com seus labels
- Pré-selecionar a 1ª opção
- Passar a escolha pra action de aprovação
- Se status vira APPROVED, salvar `approvedSpace`. Se vira CANCELLED, deixar `approvedSpace` como null

## Fase 2 — Modal de detalhes pro clube

### 2.1 Extrair modal compartilhado

Criar `components/booking-details-modal.tsx` (client component) baseado no modal inline de `admin-calendar.tsx:374-501`. Aceitar prop:

```ts
type Mode = "admin" | "owner" | "public";

type Props = {
  booking: BookingType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  // só usado quando mode === "admin":
  onStatusChange?: (status: BookingStatus, approvedSpace?: string) => void;
  onDelete?: () => void;
};
```

Comportamento por modo:

- **admin**: mostra TUDO (incluindo seção "Ações" com select de status + Excluir + select de approvedSpace conforme 1.6)
- **owner** (booking.createdById === session.user.id): mostra TUDO menos "Ações" — usuário-dono vê seu próprio CPF/contato/convidados, mas não muda status
- **public** (não-dono vendo APPROVED de outro): mostra APENAS: title, description, date, startTime-endTime, approvedSpace (ou ambas opções se ainda PENDING — mas público nem deveria ver PENDING). OCULTAR: clubEmail, representativeEmail, externalGuests, createdBy.name, createdBy.email

### 2.2 Refatorar admin-calendar pra usar o modal compartilhado

Trocar o `<Dialog>` inline por `<BookingDetailsModal mode="admin" ... />`. Garantir que a seção "Ações" + select de approvedSpace continuem funcionando exatamente como antes.

### 2.3 Adicionar modal no calendar do clube

Em `calendar.tsx`:

- Trocar os `<div>` de booking nos dias (linhas ~257-271) por `<button>` com onClick que abre o modal (igual ao padrão admin em linhas 205-218)
- Determinar `mode` no momento do clique:

```ts
const mode = booking.createdById === session.user.id ? "owner" : "public";
```

- (precisa do session.user.id no client — passar via prop do server component pai ou via hook do better-auth)

### 2.4 Pegar session.user.id no client

Verificar como o calendar.tsx atualmente acessa info de sessão. Se não acessa, passar `currentUserId: string` como prop do server component pai (`page.tsx` do dashboard) — mais simples que usar hook.

## Coisas que NÃO fazer nesta sessão

- Não criar `lib/email.ts` nem instalar Resend (Fase 3)
- Não criar modelo `GlobalGuestEmail` (Fase 4)
- Não instalar `googleapis` (Fase 5)
- Não implementar detecção de conflito (Fase 6)

## Antes de começar

- Confirmar quais labels e values vão ficar no `SPACE_OPTIONS` unificado (mostrar pra mim a tabela com origem `calendar` vs `admin-calendar` e a versão final escolhida)
- Confirmar se o `Textarea` do shadcn já está instalado (se não, instalar via `npx shadcn add textarea` no estilo `radix-vega`)

## Definição de pronto

- `pnpm lint` passa
- `pnpm build` passa
- Migration aplicada com sucesso
- Clube consegue criar booking com descrição e convidado externo com email
- Clube clica num booking próprio e vê modal modo "owner" (sem ações)
- Clube clica num APPROVED de outro clube e vê modal modo "public" (sem CPF/contato/nomes)
- Admin clica num booking e vê modal modo "admin" idêntico ao anterior, mas com select de approvedSpace
- Admin aprova um booking, escolhe approvedSpace, e o campo é persistido no banco

Manter pt-BR em tudo. Não introduzir libs novas além do `textarea` do shadcn (se necessário). Após terminar, listar pra mim os arquivos criados/modificados pra eu revisar.
