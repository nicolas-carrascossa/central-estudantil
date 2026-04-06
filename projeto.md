Você está trabalhando em um projeto Next.js (App Router) já funcional. Preciso que você implemente três fases de uma nova funcionalidade sem quebrar o que já existe. Leia tudo antes de começar.

STACK DO PROJETO

Next.js (App Router) + React + TypeScript
PostgreSQL (Neon) + Prisma ORM
Autenticação: Better-Auth
UI: Tailwind CSS + shadcn/ui
Lógica de servidor: Server Actions

MODELO PRISMA ATUAL — Booking
O modelo já possui os campos: title, startTime, endTime, date, clubEmail, representativeEmail, status (enum: PENDING, APPROVED, CANCELLED), spaceFirstOption, spaceSecondOption, e externalGuests (campo JSON).
Ação necessária no schema antes de tudo:
Adicione o campo email ao objeto JSON de externalGuests. O novo formato do objeto dentro do array deve ser: { name: string, cpf: string, email: string }. Isso exige quatro alterações obrigatórias em conjunto:

Gere a migration Prisma correspondente.
Atualize todas as tipagens e Zod schemas do TypeScript que referenciam externalGuests para que o campo email seja exigido.
Atualize o componente React do formulário de solicitação onde a Liga adiciona convidados externos, adicionando o campo de input de "E-mail do Convidado" na interface — sem isso, o dado nunca chegará ao banco.
Garanta que o dado do campo de e-mail está sendo passado corretamente até a Server Action createBooking.

ESTRUTURA DE ARQUIVOS RELEVANTE

As Server Actions ficam em arquivos separados por entidade. As que você vai modificar são createBooking e updateBookingStatus.
Ao criar novos arquivos (utilitários, templates), siga o padrão do projeto e coloque em pastas coerentes (ex: lib/, emails/).

FASE 1 — E-mails com Resend + React Email

Instale resend e @react-email/components.
Crie dois templates de e-mail em React usando @react-email/components do zero (sem HTML puro):

NewBookingRequestEmail: Notifica a Secretaria sobre uma nova solicitação. Deve exibir: título do evento, data, horários, espaço(s) solicitado(s), e-mail da Liga e e-mail do representante.
BookingStatusUpdateEmail: Notifica a Liga sobre aprovação ou rejeição. Deve exibir o título do evento, o novo status e uma mensagem contextual diferente para APPROVED vs CANCELLED.

Crie um arquivo utilitário lib/email.ts que inicializa o cliente Resend e exporta funções de envio para cada template.
Na Server Action createBooking: após salvar no banco com sucesso, chame o envio do NewBookingRequestEmail para o e-mail da Secretaria dentro de um try/catch isolado — uma falha no envio não deve lançar exceção nem reverter o booking salvo.
Na Server Action updateBookingStatus: após atualizar o status, chame o envio do BookingStatusUpdateEmail para clubEmail dentro de um try/catch isolado com a mesma regra acima.

FASE 2 — Google Calendar API com Service Account

O usuário ainda vai criar a Service Account no Google Cloud. Portanto, além do código, forneça um passo a passo claro de como criar a Service Account, baixar o JSON de credenciais, e compartilhar o Google Calendar com o e-mail da service account.

Instale googleapis.
Crie o utilitário lib/googleCalendar.ts que:

Autentica via Service Account usando as variáveis de ambiente (veja Fase 3).
Exporta a função createGoogleCalendarEvent(booking: Booking) que cria o evento no calendário oficial da Secretaria com: título (booking.title), data/hora de início e fim, descrição com o espaço reservado, e lista de participantes montada a partir de booking.representativeEmail + booking.clubEmail + todos os email dos objetos em booking.externalGuests.

Na Server Action updateBookingStatus: quando o novo status for APPROVED, chame createGoogleCalendarEvent após a atualização do banco, também dentro de um try/catch isolado — falha no Calendar não deve reverter o status aprovado.

FASE 3 — Variáveis de Ambiente
Liste todas as novas variáveis de ambiente necessárias para adicionar ao .env, com uma descrição de onde encontrar cada valor:

RESEND_API_KEY
RESEND_FROM_EMAIL
SECRETARIA_EMAIL
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_PROJECT_ID
CALENDAR_ID

REGRAS GERAIS PARA A IMPLEMENTAÇÃO

Nunca use any em TypeScript. Crie tipos ou interfaces onde necessário.
Todos os blocos de envio de e-mail e criação de evento no Calendar devem ter try/catch isolados com console.error para logging, garantindo que falhas em serviços externos não quebrem a operação principal no banco.
Não modifique nenhuma lógica de negócio já existente nas Server Actions além das integrações pedidas.
Ao final de cada fase, mostre um resumo dos arquivos criados e modificados naquela fase.

REGRA DE EXECUÇÃO: Não tente implementar tudo de uma vez. Execute a preparação do schema + FASE 1 completa primeiro e me pergunte se está tudo funcionando antes de prosseguir. Só avance para a FASE 2 depois que eu validar. Só avance para a FASE 3 depois que eu validar a FASE 2.

