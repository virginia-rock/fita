# Conta do Aluno e Vínculo com Personal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformar alunos profissionais em contas Fita reais, mantendo os dados sob propriedade do aluno, bloqueando edição durante o vínculo e restaurando a autonomia ao encerrá-lo.

**Architecture:** `auth.users` continua sendo a identidade do aluno e `fita_data.user_id` continua sendo o dono dos dados. Uma tabela de vínculos e RPCs security-definer autorizam o personal a operar sobre o workspace do aluno sem conceder acesso direto à tabela. A área `/profissional` gerencia vínculos; `/app` exibe a aba somente-leitura `Meu Personal` enquanto o vínculo está ativo.

**Tech Stack:** TanStack Start/Router, React, TypeScript, Supabase Auth/Postgres/RLS/RPCs, Stripe entitlements existentes, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-23-fita-aluno-conta-vinculo-profissional-design.md`

## Global Constraints

- Não duplicar dados do aluno: `fita_data.user_id` permanece o proprietário.
- Não apagar dados, conta ou entitlement quando um vínculo terminar.
- Toda autorização profissional deve ser validada no backend; a UI não é uma barreira de segurança.
- O plano individual do aluno permanece separado do plano profissional.
- Manter os identificadores de planos Stripe já implementados.
- Preservar o histórico Lovable; não reescrever commits publicados.

## Review Focus

- Convite aceito por usuário diferente do e-mail convidado deve falhar.
- Um aluno desvinculado deve recuperar edição sem perder nenhum registro.
- Um personal revogado não pode consultar o aluno usando um `link_id` antigo.
- O limite deve contar somente vínculos `active`, não convites expirados nem vínculos encerrados.
- Falha de entitlement não pode rebaixar silenciosamente a autorização do vínculo.

### Task 1: Formalizar o domínio de vínculo

**Files:**
- Create: `src/lib/professional-links.ts`
- Test: `tests/professional-links.test.mjs`

**Interfaces:**
- Produces `ProfessionalLinkStatus`, `ProfessionalLink`, `canProfessionalManageLink(link, actorId)`, `canStudentEdit(link, actorId)` and `professionalLimitForPlan(plan)`.

- [ ] Escrever testes para os estados `pending`, `active`, `ended` e `revoked`, verificando que somente `active` autoriza operação profissional.
- [ ] Executar `node --test tests/professional-links.test.mjs`; esperado: falha porque o módulo ainda não existe.
- [ ] Implementar as funções puras sem acessar `window`, Supabase ou React.
- [ ] Executar o mesmo teste; esperado: todos os casos passam.
- [ ] Executar `node --test tests/*.test.mjs`; esperado: suíte verde.

### Task 2: Criar schema, RLS e constraints

**Files:**
- Create: `supabase/migrations/20260923000002_create_professional_links.sql`
- Test: `tests/professional-links-schema.test.mjs`

**Interfaces:**
- Produces tables `fita_professional_links` and `fita_professional_invitations`, plus RLS policies e índices para `professional_user_id`, `student_user_id` e status ativo.

- [ ] Escrever teste textual que exija foreign keys para `auth.users`, status válidos, bloqueio de auto-vínculo e índice de vínculos ativos.
- [ ] Executar `node --test tests/professional-links-schema.test.mjs`; esperado: falha pelos objetos ausentes.
- [ ] Criar as tabelas, constraints, RLS e grants mínimos. O aluno poderá ler seus próprios vínculos; o profissional poderá consultar apenas seus próprios vínculos; escrita passará pelas RPCs da Task 3.
- [ ] Executar o teste textual; esperado: passa.
- [ ] Executar `npx supabase db push` em ambiente Supabase de desenvolvimento e confirmar migration aplicada sem erro.

### Task 3: Implementar convites e vínculo seguro

**Files:**
- Modify: `supabase/migrations/20260923000002_create_professional_links.sql`
- Create: `src/lib/professional-link-api.ts`
- Test: `tests/professional-link-api.test.mjs`

**Interfaces:**
- Produces `createProfessionalInvitation(email)`, `acceptProfessionalInvitation(token)`, `endProfessionalLink(linkId)` e `leaveProfessionalLink(linkId)`.

- [ ] Escrever testes de contrato para convite, aceitação pelo e-mail correto, rejeição por e-mail incorreto, token expirado e encerramento idempotente.
- [ ] Executar `node --test tests/professional-link-api.test.mjs`; esperado: falha por contrato ausente.
- [ ] Implementar RPCs security-definer com `auth.uid()`; o token bruto não será persistido, somente seu hash e expiração.
- [ ] Implementar o wrapper Supabase que retorna erros seguros e não registra tokens.
- [ ] Executar os testes; esperado: passa.
- [ ] Adicionar teste de integração manual: dois usuários, convite, aceite e encerramento; esperado: cada usuário só vê os vínculos autorizados.

### Task 4: Bloquear edição do aluno durante vínculo ativo

**Files:**
- Modify: `src/lib/storage.ts`
- Modify: `src/routes/app.tsx`
- Modify: `src/components/AppShell.tsx`
- Create: `src/components/StudentProfessionalTab.tsx`
- Test: `tests/student-edit-permissions.test.mjs`

**Interfaces:**
- Consumes `ProfessionalLink` e `canStudentEdit` da Task 1.
- Produces read-only state `studentEditingLocked` e rota/aba `Meu Personal`.

- [ ] Escrever teste que permita edição sem vínculo, bloqueie `nova`/salvamento com vínculo ativo e permita edição após status `ended`.
- [ ] Executar o teste; esperado: falha.
- [ ] Carregar o vínculo ativo após autenticação; esconder/desabilitar ações de edição e mostrar motivo do bloqueio.
- [ ] Colocar uma segunda validação no limite de salvamento antes de escrever local ou remotamente.
- [ ] Implementar `Meu Personal` como leitura de avaliação, evolução, fotos e relatórios permitidos.
- [ ] Executar testes direcionados e `node --test tests/*.test.mjs`; esperado: verde.

### Task 5: Fazer o painel profissional operar sobre contas reais

**Files:**
- Modify: `src/routes/profissional.tsx`
- Modify: `src/lib/professional.ts`
- Modify: `src/lib/professional-link-api.ts`
- Test: `tests/professional-dashboard-contract.test.mjs`

**Interfaces:**
- Consumes `list_professional_students()` e `get_professional_student_workspace(linkId)`.
- Produces ações `Convidar aluno`, `Aceitar vínculo pendente`, `Registrar avaliação`, `Encerrar vínculo` e `Abrir perfil`.

- [ ] Escrever teste de contrato para lista somente de alunos vinculados ao profissional e para ausência de aluno após encerramento.
- [ ] Executar o teste; esperado: falha.
- [ ] Substituir alunos demo como fonte principal por dados Supabase; manter demo somente quando Supabase estiver explicitamente indisponível em desenvolvimento.
- [ ] Adicionar formulário de convite e estado de convite pendente.
- [ ] Adicionar cadastro de avaliação no workspace do aluno via RPC, incluindo peso, medidas, composição, fotos e observações.
- [ ] Validar limite profissional no backend antes de criar convite/vínculo; exibir upgrade quando excedido.
- [ ] Executar testes, build e lint direcionado; esperado: verde.

### Task 6: Preservar autonomia e plano individual no desligamento

**Files:**
- Modify: `src/lib/entitlements.ts`
- Modify: `src/routes/conta.tsx`
- Modify: `src/routes/app.tsx`
- Test: `tests/professional-link-lifecycle.test.mjs`

**Interfaces:**
- Consumes `endProfessionalLink` e `leaveProfessionalLink`.
- Produces lifecycle behavior: active → ended sem alterar `fita_data` ou `fita_entitlements`.

- [ ] Escrever testes que capturem contagem de registros antes/depois, plano individual antes/depois e edição liberada após encerramento.
- [ ] Executar o teste; esperado: falha.
- [ ] Implementar encerramento sem delete em dados do aluno e revogação imediata do acesso do profissional.
- [ ] Garantir que `isCloudEntitled` continue dependendo somente do entitlement individual do aluno.
- [ ] Mostrar no aluno a transição para Free/Pro individual sem mensagem de perda de dados.
- [ ] Executar suíte completa; esperado: verde.

### Task 7: Relatórios e controle por plano

**Files:**
- Create: `src/lib/professional-reports.ts`
- Modify: `src/routes/profissional.tsx`
- Modify: `src/components/StudentProfessionalTab.tsx`
- Test: `tests/professional-reports.test.mjs`

**Interfaces:**
- Produces `buildStudentReport(workspace, previousWorkspace)` e `canGenerateProfessionalReport(plan)`.

- [ ] Escrever testes para comparação atual/anterior, variação de medidas, inclusão opcional de fotos e bloqueio em `personal`.
- [ ] Executar teste; esperado: falha.
- [ ] Implementar relatório determinístico em modelo de dados pronto para PDF, liberado para `professional_personal_pro` e `professional_studio`.
- [ ] Adicionar ação de geração/download e aba de relatórios somente leitura para o aluno.
- [ ] Executar teste e suíte completa; esperado: verde.

### Task 8: Verificação final e documentação operacional

**Files:**
- Modify: `README.md`
- Modify: `supabase/functions/create-checkout-session/README.md`
- Create: `docs/profissional-aluno-fluxo.md`

- [ ] Documentar configuração de auth, convite, RLS, migrations, secrets Stripe e fluxo de encerramento.
- [ ] Executar `node --test tests/*.test.mjs` e registrar quantidade de testes.
- [ ] Executar `npm run build`.
- [ ] Executar `npx eslint` nos arquivos alterados.
- [ ] Testar manualmente: aluno sem vínculo, convite aceito, edição bloqueada, avaliação do personal, relatório, encerramento e edição restaurada.
- [ ] Executar `git diff --check` e revisar o diff contra a Spec.
- [ ] Commitar em mudanças pequenas, sem force-push, rebase ou alteração de histórico publicado.

## Dependências e lacunas deliberadas

O MVP assume um único vínculo profissional ativo por aluno e convite por e-mail.
Equipe Studio, múltiplos profissionais e sincronização colaborativa ficam fora
do plano. A geração de PDF pode começar com um documento HTML imprimível; um
renderizador PDF dedicado só entra se a experiência inicial exigir arquivo
binário.
