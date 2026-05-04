# Processo de trabalho — ce-platform

Este documento define como trabalhamos nas sessões de desenvolvimento
do ce-platform. Aplica-se igualmente a Claude no chat (planejamento)
e Claude Code (execução).

## Papéis

- **Claude no chat (planejamento):** parceiro de discussão, escreve
  specs, revisa entregas. NÃO escreve código.
- **Claude Code (execução):** executa specs aprovadas, escreve código,
  faz commits. NÃO toma decisões de produto sem confirmar.
- **Eu (Nicolas):** decido prioridades, valido com stakeholders,
  aprovo specs e commits.

## Fluxo de uma sessão

1. **Discussão (chat):** decidir escopo da próxima feature
2. **Spec (chat):** escrever spec curta em Markdown, salvar em
   `docs/features/sessao-X-nome.md` e commitar na main
3. **Execução (Claude Code):** colar spec, executar
4. **Revisão (chat):** revisar o que Claude Code fez, decidir
   próximos passos
5. **Atualização (Claude Code):** atualizar CLAUDE.md ao final
   de cada sessão

## Regras

### Para Claude (chat e Code)

- **Comando aprovado é comando aprovado.** Não adicionar flags,
  passos ou mudanças não pedidas. Se faltar info, perguntar.
- **Antes de afirmar sobre estado do código, confirmar.** Não
  assumir — pedir pra rodar comando.
- **Specs são curtas.** Cabem em ~1 página. Over-engineering é
  bandeira vermelha.
- **Aprovação por etapas.** Decisões críticas (migrations,
  refactors, deletes) sempre passam por confirmação.
- **Tudo em pt-BR.**

### Para Claude Code (execução)

- Cada sessão = 1 branch dedicada (`claude/sessao-X-nome` ou similar)
- Commits pequenos e descritivos com prefixo conventional
  (`feat:`, `fix:`, `docs:`, `chore:`)
- Push proativo no fim de cada fase, não esperar o fim da sessão
- DoD inclui: `pnpm lint`, `pnpm build`, validação manual quando
  aplicável

### Para mim (Nicolas)

- Não pular etapas de revisão por preguiça
- Quando achar que Claude está complicando, falar "tá complicando,
  simplifica"
- Validar com stakeholders ANTES de codar features que dependem
  de processo deles

## Padrões de spec

Estrutura mínima de uma spec:

1. **Objetivo** — uma frase
2. **Contexto** — por que estamos fazendo
3. **Escopo** — o que FAZER
4. **Fora de escopo** — o que NÃO fazer
5. **Critérios de aceite** — checklist verificável
6. **Time-box** — duração esperada

Specs ficam em `docs/features/sessao-X-nome.md`, commitadas na main.

## Segurança

- Nunca imprimir conteúdo de `.env`, `.env.local`, `.vscode/settings.json`
- Nunca commitar credenciais
- Se uma chave passar pelo chat, rotacionar depois

## Branches e housekeeping

- Cada sessão = nova branch a partir de `main` atualizada
- PR pra `main` com merge commit (não squash) preserva histórico
  granular
- Housekeeping de branches/worktrees no fim de cada semana
