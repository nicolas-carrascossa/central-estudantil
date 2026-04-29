# Visão de produto — Central Estudantil

Este documento descreve o **fluxo completo** que o sistema implementa,
do ponto de vista dos usuários reais. É a "estrela do norte" do projeto:
toda decisão técnica deve servir esse fluxo.

## Atores

- **Liga / Clube estudantil** — usuário comum (`role: "user"`). Solicita reservas de espaços.
- **Central Estudantil / Secretaria** — admin (`role: "admin"`). Aprova ou cancela pedidos.
- **Sistema (ce-platform)** — automatiza o que hoje a secretaria faz na mão.
- **Google Calendar da Secretaria** — calendário institucional onde os eventos aprovados aparecem.

## Fluxo principal

### 1. Solicitação (clube)

A liga preenche o formulário de agendamento no site, incluindo:

- Título e descrição do evento
- Data e horário (início/fim)
- 1ª e 2ª opção de espaço
- Email do clube e do representante
- Lista de convidados externos (nome, CPF, email opcional)

O site salva o booking com status `PENDING`.

### 2. Alerta (sistema)

Imediatamente após salvar, o site dispara automaticamente um email
para a Central Estudantil avisando que há pedido novo aguardando análise.

### 3. Decisão (secretaria)

A secretaria acessa o painel Admin (`/z_admin`), abre o booking
pendente, escolhe entre a 1ª ou 2ª opção de espaço, e clica:

- **Aprovar** → status vira `APPROVED`, com `approvedSpace` registrado
- **Cancelar** → status vira `CANCELLED`

### 4. Ação automática (sistema, ao aprovar)

Tudo isso acontece em sequência, sem intervenção humana:

1. **Banco:** status muda para `APPROVED`, `approvedSpace` é salvo.
2. **Email pra liga:** notificação de aprovação enviada para `clubEmail` e `representativeEmail`.
3. **Google Calendar:** o sistema cria o evento no calendário institucional da secretaria, com:
   - Título e descrição do booking
   - Data, horário e local (`approvedSpace`)
   - Lista de convidados:
     - Convidados externos (com email)
     - Email do clube
     - Email do representante
     - Email da Central Estudantil
     - **Lista global configurável** de emails que sempre recebem convite (ex: diretora acadêmica, segurança, etc) — gerenciada pelo admin
4. **Convite de agenda:** o Google dispara automaticamente o convite de agenda para todos os emails listados.

## Por que esse fluxo

Hoje, ao aprovar um evento, a secretaria faz manualmente:

- Envia emails para a liga e convidados externos
- Cria o evento no Google Calendar
- Adiciona cada pessoa como convidado, uma por uma

Esse trabalho repetitivo é **o que o sistema automatiza**. A Central
Estudantil só precisa decidir "aprovado ou não" — o resto é automático.

## Estado de implementação por etapa do fluxo

| Etapa                                | Status                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| 1. Solicitação                       | ✅ Implementado                                                                         |
| 2. Alerta (email pra secretaria)     | ⚠️ Implementado parcialmente — funciona em sandbox Resend (só envia pra owner da conta) |
| 3. Decisão (admin aprova/cancela)    | ✅ Implementado, com seleção de espaço aprovado                                         |
| 4. Ação automática — banco           | ✅ Implementado                                                                         |
| 4. Ação automática — email pra liga  | ⚠️ Idem etapa 2 (sandbox)                                                               |
| 4. Ação automática — Google Calendar | ❌ Não implementado (Fase 5 do roadmap)                                                 |
| 4. Ação automática — lista global    | ❌ Não implementado (Fase 4 do roadmap)                                                 |

## Pendências externas (não-código) que destravam o fluxo

- **Domínio próprio verificado no Resend** — destrava etapas 2 e 4 (envio de email pra qualquer destinatário, não só sandbox).
- **Service account Google Workspace ou OAuth institucional** — destrava etapa 4 (criação no Google Calendar).

## Documentos relacionados

- `CLAUDE.md` — contexto técnico do código
- `docs/features/*.md` — specs de features individuais
