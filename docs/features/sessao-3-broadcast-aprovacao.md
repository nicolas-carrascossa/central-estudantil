# Sessão 3 — Broadcast de aprovação

## 1. Objetivo

Ao aprovar um booking, o email de status vai para clube, representante,
convidados externos com email e lista global — em vez de só pro clube.

## 2. Contexto

Hoje `sendBookingStatusUpdateEmail` recebe `to: string` e `server/booking-admin.ts`
passa só `clubEmail`. Três coisas em aberto:

- `representativeEmail` é ignorado (bug existente).
- Convidados externos com email preenchido não são notificados.
- `GlobalGuestEmail` (Sessão 2) tem CRUD pronto mas nunca é consumido.

Esta sessão fecha a Lacuna 4 do CLAUDE.md sem mexer em GCal — Sessão 4
plugará o calendário em cima do mesmo ponto de envio.

Versão fina por decisão explícita: nada de helper unificado pré-GCal.

## 3. Escopo

### 3.1 `lib/email.ts`
- Trocar assinatura de `sendBookingStatusUpdateEmail`:
  - `to: string | string[]`
  - `bcc?: string[]` (novo, opcional)
- Repassar `to` e `bcc` direto pro `resend.emails.send`. Se `bcc` for
  array vazio ou `undefined`, omitir do payload (verificar comportamento
  do SDK; o Resend ignora chaves `undefined`, então passar `undefined` é seguro).
- Demais funções (`sendNewBookingRequestEmail`) ficam intactas.

### 3.2 `server/booking-admin.ts` — em `adminUpdateBookingStatus`

**Quando `status === "APPROVED"`:**

Toda a montagem de destinatários e o envio acontecem **dentro do try/catch
de email que já existe** (não no try/catch externo da action). Razão: falha
em qualquer etapa do email não deve reverter a mutação no banco.

Passos dentro desse try:
- Buscar todos os `GlobalGuestEmail` via Prisma.
  - Se a busca falhar, logar `console.error("Erro ao buscar lista global:", err)` e seguir com `globalEmails = []`. Envio continua sem lista global em vez de falhar tudo.
- Filtrar `externalGuests` mantendo só os com `email?.trim()` preenchido.
- Montar:
  - `to = [clubEmail, representativeEmail]`
  - `bcc = [...globalEmails, ...externosComEmail]`
- Normalizar (`.trim().toLowerCase()`) e deduplicar:
  - Dedup interno em cada lista (Set).
  - Remover do `bcc` qualquer email que já esteja em `to`.
  - Se `bcc` resultar vazio, passar `undefined` na chamada (não array vazio).
- Chamar `sendBookingStatusUpdateEmail({ to, bcc, title, status })`.

**Quando `status === "CANCELLED"`:**
- `to = [clubEmail, representativeEmail]` (corrige bug do representante).
- Sem `bcc`. Lista global e externos não são notificados.

Em ambos os casos, manter o `try/catch` que loga erro de email sem
quebrar a transação (padrão atual).

### 3.3 `emails/booking-status-update.tsx`
- Reescrever o parágrafo de aprovação removendo menção a "calendário oficial":
  - **De:** "Sua solicitação foi aprovada com sucesso. O evento já foi adicionado ao calendário oficial. Compareça no dia e horário agendados."
  - **Para:** "Sua solicitação foi aprovada. Confira os detalhes do evento abaixo."
- Bloco de cancelamento fica como está.
- Não tocar em estilos hardcoded (dívida conhecida).

### 3.4 `CLAUDE.md`
- Lacuna 4 → marcada como ✅ RESOLVIDO (Sessão 3) com link pros arquivos tocados.
- Nota em "Gotchas": template do email de status não menciona GCal por enquanto; revisar quando Sessão 4 entrar.

## 4. Fora de escopo

- Helper `notifyApproval(booking)` ou qualquer extração de orquestração.
- Preparação ou ponto de extensão pra Google Calendar.
- Detecção de conflito de espaço (Lacuna 2 — Sessão 5).
- Refator dos hardcoded colors no template (dívida conhecida, segue lá).
- Refator das outras funções de email pra suportar `bcc`.
- Broadcast em `CANCELLED`. Só correção do bug do representante.
- Schema/UI de convidados externos (já OK, segundo confirmação).
- Template novo. Mantém `BookingStatusUpdateEmail`.

## 5. Critérios de aceite

- [ ] `sendBookingStatusUpdateEmail` aceita `to: string | string[]` e `bcc?: string[]`.
- [ ] Aprovar um booking dispara um email com:
  - `to`: `clubEmail` + `representativeEmail`
  - `bcc`: `GlobalGuestEmail`s + `externalGuests` com `email` preenchido
  - Sem duplicatas; comparação case-insensitive (`.trim().toLowerCase()`)
  - Sem nenhum email do `to` aparecendo também no `bcc`
- [ ] Cancelar um booking dispara email com `to`: `clubEmail` + `representativeEmail`, sem `bcc`.
- [ ] Falha na busca de `GlobalGuestEmail` não impede envio do email — segue com `bcc` reduzido a externos.
- [ ] Texto do template aprovado: "Sua solicitação foi aprovada. Confira os detalhes do evento abaixo." (sem menção a "calendário oficial").
- [ ] `pnpm lint` zero erros novos. `pnpm build` OK.
- [ ] CLAUDE.md atualizado: Lacuna 4 marcada como resolvida.

### Validação manual (obrigatória, fazer e reportar)

1. Criar booking de teste com convidados externos (alguns com email, outros sem) e `clubEmail`/`representativeEmail` diferentes do dono da conta Resend.
2. Cadastrar 2 emails na lista global via `/z_admin`.
3. Aprovar o booking via UI admin.
4. Acessar dashboard do Resend (https://resend.com/emails) e abrir o email enviado.
5. **Confirmar visualmente:**
   - Campo `to` contém `clubEmail` e `representativeEmail`.
   - Campo `bcc` contém os 2 emails da lista global + emails dos convidados externos que tinham email.
   - Nenhum email aparece em `to` E `bcc` simultaneamente.
   - Nenhuma duplicata.
   - Email NÃO menciona "calendário oficial" no texto.
6. Cancelar o mesmo booking via UI admin.
7. **Confirmar no Resend:** novo email enviado, `to` com clube + representante, `bcc` ausente ou vazio.
8. Reportar com print do dashboard ou colando dados (com emails mascarados se sensíveis).

## 6. Time-box

~1h30:
- 10 min — assinatura `lib/email.ts`
- 30 min — montagem de destinatários em `booking-admin.ts` (busca, filtro, dedup)
- 5 min — texto do template
- 15 min — validação manual no Resend dashboard (roteiro acima)
- 15 min — atualização de CLAUDE.md + commit/push
- 15 min — buffer