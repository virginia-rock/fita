# Supabase Entitlements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir o plano Pro no Supabase e carregá-lo após login, mantendo o checkout simulado substituível por uma futura integração Stripe/webhook.

**Architecture:** Criar uma tabela `fita_entitlements` separada de `fita_data`. O cliente poderá ler apenas seu próprio entitlement; a ativação do checkout demo usará uma função RPC explicitamente marcada como demo, enquanto uma futura integração poderá substituir essa escrita por webhook/server-side sem alterar o frontend de armazenamento. O `localStorage` continuará como cache/migração legada, nunca como fonte principal após o entitlement remoto ser carregado.

**Tech Stack:** React 19, TypeScript, TanStack Router, Supabase JS, PostgreSQL/RLS, testes Node existentes.

**Spec:** `docs/superpowers/specs/2026-09-21-supabase-entitlements-design.md`

## Global Constraints

- Não usar `service_role` ou chave secreta em variáveis `VITE_*`.
- `fita_data` continua contendo somente medições e recorrência.
- Entitlement remoto deve ser vinculado a `auth.uid()` e protegido por RLS.
- Checkout demo deve ser identificado por `source = 'demo'` para futura substituição por Stripe.
- Falha ao carregar entitlement não pode rebaixar silenciosamente uma conta Pro para gratuita.

## Review Focus

- Usuário Pro faz logout/login: o plano e a sincronização devem permanecer ativos; coberto pela tarefa 3.
- Usuário Pro abre outro navegador: o plano remoto deve ser reconhecido sem `fita.demo-account`; coberto pela tarefa 3.
- Usuário gratuito consulta o banco: não deve ler entitlement de outra conta; coberto pela tarefa 1.
- Plano `cloud_month` expirado ou assinatura cancelada: não deve sincronizar, mas não deve apagar medições; coberto pelas tarefas 2 e 3.
- Falha de rede/tabela indisponível: a tela deve mostrar erro de sincronização, não “Plano gratuito”; coberto pela tarefa 3.

### Task 1: Criar o modelo de entitlement no Supabase

**Files:**
- Create: `supabase/migrations/20260921000001_create_fita_entitlements.sql`
- Test: `tests/entitlements-schema.test.mjs`

**Interfaces:**
- Produces table `public.fita_entitlements` with `user_id`, `plan`, `status`, `expires_at`, `source`, `updated_at`.
- Produces RPC `public.activate_demo_entitlement(target_plan text)` returning the updated entitlement row.

- [ ] **Step 1: Write the schema assertions**

  Assert the migration text contains the primary key reference to `auth.users`, the allowed plan/status/source checks, RLS, a self-read policy, and the demo activation function.

- [ ] **Step 2: Run the schema test and verify it fails**

  Run: `node --test tests/entitlements-schema.test.mjs`

  Expected: FAIL because the migration and test do not exist yet.

- [ ] **Step 3: Write the migration**

  Create the table with `user_id uuid primary key references auth.users(id) on delete cascade`, constrained text values, nullable `expires_at`, UTC `updated_at`, RLS, and a select policy using `auth.uid() = user_id`. Add an update trigger for `updated_at`. Add `activate_demo_entitlement(target_plan text)` as a `security definer` function that rejects invalid plans, derives `expires_at` only for `cloud_month`, uses `auth.uid()`, writes `source = 'demo'`, and returns the row. Grant execute only to `authenticated`.

- [ ] **Step 4: Run the schema test and verify it passes**

  Run: `node --test tests/entitlements-schema.test.mjs`

  Expected: PASS. Apply this migration in the Supabase SQL Editor before testing the live flow.

- [ ] **Step 5: Commit the schema change**

  Run: `git add supabase/migrations/20260921000001_create_fita_entitlements.sql tests/entitlements-schema.test.mjs` then `git commit -m "feat: add Supabase entitlement schema"`.

### Task 2: Add the entitlement data boundary

**Files:**
- Create: `src/lib/supabase-entitlements.ts`
- Modify: `src/lib/supabase-data.ts`
- Test: `tests/entitlements-data.test.mjs`

**Interfaces:**
- `loadEntitlement(): Promise<Entitlement | null>` reads the authenticated user’s row.
- `activateDemoEntitlement(plan: Exclude<DemoPlan, "local">): Promise<Entitlement>` calls the RPC.
- `isCloudEntitled(entitlement: Entitlement | null, now?: Date): boolean` centralizes active/expiry rules.

- [ ] **Step 1: Write failing pure entitlement tests**

  Cover active subscription, active unexpired monthly Pro, expired monthly Pro, canceled subscription, and null entitlement.

- [ ] **Step 2: Run the tests and verify they fail**

  Run: `node --test tests/entitlements-data.test.mjs`

  Expected: FAIL because the entitlement module is not present.

- [ ] **Step 3: Implement typed parsing and cloud-access rules**

  Define the entitlement type and parsers without trusting unknown server payloads. Keep all date checks in `isCloudEntitled`.

- [ ] **Step 4: Implement Supabase read and demo activation**

  Use the existing `supabase` client, return `null` when not configured or unauthenticated, throw Supabase errors, and call `.rpc("activate_demo_entitlement", { target_plan: plan })` for demo activation. Do not expose service credentials.

- [ ] **Step 5: Run the tests and verify they pass**

  Run: `node --test tests/entitlements-data.test.mjs`

  Expected: PASS.

- [ ] **Step 6: Commit the data boundary**

  Run: `git add src/lib/supabase-entitlements.ts src/lib/supabase-data.ts tests/entitlements-data.test.mjs` then `git commit -m "feat: add entitlement data boundary"`.

### Task 3: Load entitlements in account and app storage

**Files:**
- Modify: `src/lib/storage.ts`
- Modify: `src/routes/conta.tsx`
- Modify: `src/routes/checkout.tsx`
- Modify: `src/components/MembershipStatus.tsx`
- Modify: `src/components/AppShell.tsx`
- Test: `tests/entitlements-flow.test.mjs`

**Interfaces:**
- `useAppData()` obtains the remote entitlement before enabling cloud sync.
- Checkout calls `activateDemoEntitlement(plan)` and retains the local account only as a compatibility cache.
- Account display uses remote entitlement first and distinguishes loading/error from a real free plan.

- [ ] **Step 1: Write the flow regression tests**

  Test the decision table: remote active Pro enables sync, remote free disables sync, a legacy local Pro can be migrated once when the authenticated ID matches, and an entitlement read error is reported rather than mapped to free.

- [ ] **Step 2: Run the tests and verify they fail**

  Run: `node --test tests/entitlements-flow.test.mjs`

  Expected: FAIL because the current flow derives access only from `loadDemoAccount()`.

- [ ] **Step 3: Replace the local-only plan decision**

  Load the entitlement alongside cloud data, expose entitlement loading/error state, and use `isCloudEntitled` for `cloudSyncEnabled`. Preserve local measurements until cloud data loads; do not clear them on a transient entitlement error.

- [ ] **Step 4: Update account and checkout behavior**

  In checkout, call the demo RPC after the simulated payment completes, then update the local cache. In `/conta`, render the remote plan/status and show a clear synchronization error if entitlement loading failed. Keep cancellation as a demo operation until real billing is connected.

- [ ] **Step 5: Add one-time legacy migration**

  If a matching authenticated local Pro cache exists and no remote entitlement exists, call the demo activation RPC idempotently; never overwrite a non-null remote entitlement. Record completion only after the RPC succeeds.

- [ ] **Step 6: Run regression tests and build**

  Run: `node --test tests/entitlements-flow.test.mjs` and `npm run build`.

  Expected: all entitlement flow tests pass and the production build exits 0.

- [ ] **Step 7: Commit the integration**

  Run: `git add src/lib/storage.ts src/routes/conta.tsx src/routes/checkout.tsx src/components/MembershipStatus.tsx src/components/AppShell.tsx tests/entitlements-flow.test.mjs` then `git commit -m "feat: persist Pro entitlements"`.

### Task 4: Live Supabase verification and handoff

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Apply the new migration in the Supabase SQL Editor**

  Run `supabase/migrations/20260921000001_create_fita_entitlements.sql` in the connected project and verify the table, RLS policies, and function exist.

- [ ] **Step 2: Verify the user journey**

  With a test account, activate the simulated Pro plan, confirm `/conta` reports cloud synchronization, log out, log back in, and confirm the same plan remains active. Create a measurement and verify its row in `fita_data`.

- [ ] **Step 3: Document the future payment boundary**

  Update README to state that the demo checkout calls the demo RPC and that production payments must update `fita_entitlements` server-side through a webhook.

- [ ] **Step 4: Run final verification**

  Run: `node --test tests/entitlements-schema.test.mjs tests/entitlements-data.test.mjs tests/entitlements-flow.test.mjs`, `npm run build`, and `git diff --check`.

  Expected: all tests pass, build exits 0, and diff check reports no whitespace errors.
