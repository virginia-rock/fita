# Fita Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um painel Admin persistente para `carlospessin@gmail.com`, com métricas e listas de usuários por plano, sem alterar o Stripe como fonte de verdade dos acessos.

**Architecture:** Uma migration cria o papel administrativo persistente e a data de início de assinatura. Edge Functions autenticadas validam esse papel com service role antes de combinar `auth.users` com `fita_entitlements`. O cliente lê apenas o próprio papel via RLS e chama essas APIs protegidas para renderizar uma rota dentro de `AppShell`.

**Tech Stack:** React 19, TanStack Router, TypeScript, Tailwind CSS, Supabase Auth/Database/Edge Functions, Stripe webhook, Node built-in test.

**Spec:** `docs/superpowers/specs/2026-09-24-fita-admin-dashboard-design.md`

## Global Constraints

- Stripe e o webhook continuam como a única fonte de verdade para acesso, plano, limites e cancelamento.
- O cupom vitalício permanece exclusivamente no Stripe; o Fita não o armazena, valida ou aplica.
- Só registros em `public.fita_admin_access` recebem métricas ou e-mails globais.
- A UI reutiliza `AppShell` e não cria entitlement, bypass ou simulação administrativa.
- Migrations já aplicadas não serão alteradas.
- `subscribed_at` só é preenchido na primeira ativação Stripe futura; registros legados continuam nulos.

## Review Focus

- Token sem papel Admin recebe `403` antes da enumeração de `auth.users`; testar a ordem da autorização na Function.
- Entitlement ausente, `local`, cancelado ou expirado aparece como Free; testar a classificação compartilhada.
- Renovação, falha de cobrança ou cancelamento não sobrescrevem `subscribed_at`; testar mapper, chamada RPC e SQL.
- Filtro arbitrário, página negativa ou limite maior que 100 não dispara busca administrativa; testar parser.
- Payload malformado ou falha de nova busca não mostra dados incorretos; testar parser e retenção da última página válida.

---

### Task 1: Persistir papel Admin e início de assinatura

**Files:**
- Create: `supabase/migrations/20260924000002_create_fita_admin_access.sql`
- Test: `tests/admin-schema.test.mjs`

**Interfaces:**
- Produces: tabela `fita_admin_access(user_id uuid primary key, role text, created_at timestamptz, updated_at timestamptz)`.
- Produces: `fita_entitlements.subscribed_at timestamptz null` e RPC `apply_stripe_entitlement_event(..., p_subscribed_at timestamptz)`.
- Consumed by: Tasks 2 e 3.

- [ ] **Step 1: Write the failing test**

```js
test("admin migration persists role and subscription start", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260924000002_create_fita_admin_access.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists public\.fita_admin_access/i);
  assert.match(sql, /lower\(email\) = 'carlospessin@gmail\.com'/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /for select[\s\S]*auth\.uid\(\)[\s\S]*= user_id/i);
  assert.match(sql, /add column if not exists subscribed_at timestamptz/i);
  assert.match(sql, /p_subscribed_at timestamptz/i);
  assert.match(sql, /subscribed_at = coalesce\(public\.fita_entitlements\.subscribed_at, excluded\.subscribed_at\)/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-schema.test.mjs`

Expected: FAIL porque a migration ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Criar a tabela com `role text not null default 'admin' check (role = 'admin')`, timestamps UTC, RLS e policy de leitura com `auth.uid() = user_id`; revogar tudo de `anon, authenticated`, depois conceder apenas `select` a `authenticated`. Inserir idempotentemente o ID de `auth.users` cujo `lower(email) = 'carlospessin@gmail.com'` e deixar, em comentário SQL, a mesma instrução para rodar após cadastro se necessário.

Adicionar `subscribed_at timestamptz` a `fita_entitlements`. Recriar a versão atual de 13 parâmetros de `apply_stripe_entitlement_event` como versão de 14 parâmetros, incluindo a coluna/valor no insert e preservando-a no conflito:

```sql
subscribed_at = coalesce(
  public.fita_entitlements.subscribed_at,
  excluded.subscribed_at
)
```

Revogar/grantar `service_role` para a assinatura de 14 parâmetros.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin-schema.test.mjs`

Expected: PASS 1/1.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260924000002_create_fita_admin_access.sql tests/admin-schema.test.mjs
git commit -m "feat: persist admin access and subscription start"
```

### Task 2: Registrar a primeira ativação Stripe

**Files:**
- Modify: `supabase/functions/_shared/stripe-event-mapper.ts`
- Modify: `supabase/functions/stripe-webhook/index.ts`
- Modify: `tests/stripe-webhook.test.mjs`
- Test: `tests/admin-webhook-contract.test.mjs`

**Interfaces:**
- Consumes: RPC da Task 1.
- Produces: `StripeEntitlementMutation.subscribedAt: string | null`.
- Consumed by: dashboard da Task 3.

- [ ] **Step 1: Write the failing test**

Adicionar ao teste de Checkout bem-sucedido:

```js
assert.equal(result?.subscribedAt, "2026-09-22T12:00:00.000Z");
```

Criar o contrato:

```js
test("webhook forwards subscription start to the Stripe RPC", async () => {
  const source = await readFile(new URL("../supabase/functions/stripe-webhook/index.ts", import.meta.url), "utf8");
  assert.match(source, /p_subscribed_at:\s*mutation\.subscribedAt/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/stripe-webhook.test.mjs tests/admin-webhook-contract.test.mjs`

Expected: FAIL porque não há `subscribedAt`.

- [ ] **Step 3: Write minimal implementation**

Acrescentar `subscribedAt` ao tipo de mutation. Para `checkout.session.completed` e `checkout.session.async_payment_succeeded`, usar `now.toISOString()`; para eventos de subscription e invoice, usar `null`. Passar `p_subscribed_at: mutation.subscribedAt` no webhook. O `coalesce` SQL da Task 1 preserva a primeira data.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/stripe-webhook.test.mjs tests/admin-webhook-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/stripe-event-mapper.ts supabase/functions/stripe-webhook/index.ts tests/stripe-webhook.test.mjs tests/admin-webhook-contract.test.mjs
git commit -m "feat: record initial Stripe subscription date"
```

### Task 3: Criar contratos e Functions administrativas

**Files:**
- Create: `supabase/functions/_shared/admin-dashboard.ts`
- Create: `supabase/functions/get-admin-dashboard/index.ts`
- Create: `supabase/functions/get-admin-users/index.ts`
- Test: `tests/admin-dashboard-data.test.mjs`
- Test: `tests/admin-functions-contract.test.mjs`

**Interfaces:**
- Produces: `ADMIN_PLAN_FILTERS`, `AdminPlanFilter`, `classifyAdminUser`, `parseAdminUsersRequest`, e contratos serializáveis de dashboard/lista.
- Consumed by: Task 4.

- [ ] **Step 1: Write the failing test**

```js
test("classifies absent, local, canceled, and expired entitlements as free", () => {
  for (const entitlement of [null, { plan: "local", status: "active" }, { plan: "subscription_monthly", status: "canceled" }, { plan: "subscription_monthly", status: "expired" }]) {
    assert.equal(classifyAdminUser(entitlement), "free");
  }
  assert.equal(classifyAdminUser({ plan: "professional_studio", status: "active" }), "professional_studio");
  assert.equal(classifyAdminUser({ plan: "subscription_monthly", status: "pending" }), "subscription_monthly");
});
test("allows only known filters and bounded pagination", () => {
  assert.deepEqual(parseAdminUsersRequest({ plan: "free", page: 0, limit: 25 }), { plan: "free", page: 0, limit: 25 });
  assert.equal(parseAdminUsersRequest({ plan: "drop table", page: 0, limit: 25 }), null);
  assert.equal(parseAdminUsersRequest({ plan: "free", page: -1, limit: 25 }), null);
  assert.equal(parseAdminUsersRequest({ plan: "free", page: 0, limit: 101 }), null);
});
```

No contrato das Functions, ler ambas as fontes e exigir `Authorization`, `auth.getUser()`, consulta `fita_admin_access` com `role = "admin"`, resposta `403`, `admin.auth.admin.listUsers`, allowlist e os campos `email`, `subscribedAt`, `expiresAt`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-dashboard-data.test.mjs tests/admin-functions-contract.test.mjs`

Expected: FAIL porque módulo e Functions não existem.

- [ ] **Step 3: Write minimal implementation**

No módulo compartilhado, definir:

```ts
export const ADMIN_PLAN_FILTERS = [
  "all", "free", "cloud_month", "subscription", "subscription_monthly",
  "subscription_annual", "professional_personal", "professional_personal_pro",
  "professional_studio",
] as const;
export const ADMIN_PAGE_LIMIT = 50;
export const ADMIN_MAX_PAGE_LIMIT = 100;
```

A classificação devolve Free para entitlement nulo, `local`, `expired` ou `canceled`; devolve o plano apenas para `active` e `pending`. O parser requer objeto, plano allowlisted, `page` inteiro >= 0 e `limit` inteiro entre 1 e 100.

Em cada Function: aceitar OPTIONS/POST, validar Bearer token com cliente anon, buscar usuário, criar cliente service-role e autorizar **antes** da listagem:

```ts
const { data: access } = await admin
  .from("fita_admin_access").select("role")
  .eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
if (!access) return json({ error: "Admin access required." }, 403);
```

Paginar `admin.auth.admin.listUsers({ page, perPage: 1000 })` até página curta. Buscar entitlements em lotes por `user_id`. Dashboard inicia todos os contadores em zero e retorna todos os filtros. Lista aplica o filtro classificado, pagina o resultado e retorna somente `id, email, plan, status, subscribedAt, expiresAt, accountCreatedAt`. Para Free, usar `user.created_at` como `subscribedAt` e `null` como `expiresAt`; para planos pagos, usar `entitlement.subscribed_at` e `current_period_end ?? expires_at`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin-dashboard-data.test.mjs tests/admin-functions-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/admin-dashboard.ts supabase/functions/get-admin-dashboard/index.ts supabase/functions/get-admin-users/index.ts tests/admin-dashboard-data.test.mjs tests/admin-functions-contract.test.mjs
git commit -m "feat: add protected admin dashboard APIs"
```

### Task 4: Expor clientes tipados e o papel atual

**Files:**
- Create: `src/lib/admin-dashboard.ts`
- Modify: `src/lib/supabase-entitlements.ts`
- Test: `tests/admin-client-data.test.mjs`

**Interfaces:**
- Produces: `loadAdminAccess(): Promise<boolean>`, `loadAdminDashboard()`, `loadAdminUsers(filter, page)`, `parseAdminDashboard`, `parseAdminUsersPage`.
- Consumed by: Task 5.

- [ ] **Step 1: Write the failing test**

```js
test("parses complete dashboard data and rejects malformed user rows", () => {
  assert.deepEqual(parseAdminDashboard(validDashboard), validDashboard);
  assert.equal(parseAdminUsersPage({ items: [{ email: 3 }] }), null);
});
test("loads only the current persisted role", async () => {
  const source = await readFile(new URL("../src/lib/supabase-entitlements.ts", import.meta.url), "utf8");
  assert.match(source, /from\("fita_admin_access"\)/);
  assert.match(source, /select\("role"\)/);
  assert.match(source, /eq\("user_id", userData\.user\.id\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-client-data.test.mjs`

Expected: FAIL porque parsers e `loadAdminAccess` não existem.

- [ ] **Step 3: Write minimal implementation**

Criar parser defensivo para nove contadores inteiros >= 0 e itens com as seis propriedades públicas, datas string/nulas e total inteiro >= 0. As funções usam `supabase.functions.invoke` e rejeitam payloads inválidos sem retornar página parcial. Em `supabase-entitlements.ts`, implementar `loadAdminAccess` consultando somente `role` de `fita_admin_access` com o `user_id` autenticado e retornando `data?.role === "admin"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin-client-data.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-dashboard.ts src/lib/supabase-entitlements.ts tests/admin-client-data.test.mjs
git commit -m "feat: add admin dashboard client contracts"
```

### Task 5: Construir o link e a interface do dashboard

**Files:**
- Create: `src/routes/admin.tsx`
- Modify: `src/routes/conta.tsx`
- Modify: `src/routeTree.gen.ts`
- Test: `tests/admin-ui-contract.test.mjs`

**Interfaces:**
- Consumes: clientes da Task 4.
- Produces: rota `/admin` com cards, tabela paginada e estados seguro de erro.

- [ ] **Step 1: Write the failing test**

```js
test("account exposes Admin only after persisted role lookup", async () => {
  const conta = await readFile(new URL("../src/routes/conta.tsx", import.meta.url), "utf8");
  assert.match(conta, /loadAdminAccess/);
  assert.match(conta, /to="\/admin"/);
});
test("admin route keeps product shell and dashboard interaction", async () => {
  const source = await readFile(new URL("../src/routes/admin.tsx", import.meta.url), "utf8");
  for (const token of ["AppShell", "Dashboard", "loadAdminDashboard", "loadAdminUsers", "role=\"table\"", "Anterior", "Próxima", "Não foi possível carregar"]) assert.match(source, new RegExp(token));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/admin-ui-contract.test.mjs`

Expected: FAIL porque rota e link não existem.

- [ ] **Step 3: Write minimal implementation**

Em `conta.tsx`, carregar `loadAdminAccess()` somente para usuário autenticado, limpar quando sair e tratar falha como falso. Renderizar `<Link to="/admin">Admin</Link>` somente para papel persistido; não usar e-mail hardcoded e não tocar na lógica de Stripe/entitlement.

Em `admin.tsx`, criar `createFileRoute("/admin")` e encapsular tudo em `AppShell`. Antes da autorização, mostrar “Carregando painel administrativo.”; para não-admin, mostrar estado sem dados e link a `/conta`. Quando autorizado: sidebar `aria-label="Navegação administrativa"` com Dashboard; cards button para `all`, Free, legados, Pro mensal/anual, Personal, Personal Pro e Studio, cada um com `aria-pressed`. Ao selecionar card, resetar página e carregar a lista. A tabela `role="table"` mostra Email, Plano, Status, Assinou em e Expira/renova em. Formatar datas com `Intl.DateTimeFormat("pt-BR")`, exibir “Não registrado” para nulo e “—” para expiração nula. Reter a última lista válida se troca de filtro/página falhar, exibir “Não foi possível carregar”, e desabilitar Anterior/Próxima nas extremidades.

Rodar build para gerar `routeTree.gen.ts`, sem editá-lo manualmente.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/admin-ui-contract.test.mjs && npm run build`

Expected: PASS e build inclui `/admin`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin.tsx src/routes/conta.tsx src/routeTree.gen.ts tests/admin-ui-contract.test.mjs
git commit -m "feat: add admin dashboard interface"
```

### Task 6: Verificar localmente e pedir autorização de deploy

**Files:**
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: evidência da entrega e comandos remotos explícitos.

- [ ] **Step 1: Run the full test suite**

Run: `node --test tests/*.test.mjs`

Expected: PASS sem regressões em assinaturas, Insider, profissionais e Admin.

- [ ] **Step 2: Run focused lint and build**

Run: `npx eslint src/routes/admin.tsx src/routes/conta.tsx src/lib/admin-dashboard.ts src/lib/supabase-entitlements.ts && npm run build`

Expected: PASS. Se lint global falhar por formatação anterior, registrar somente a verificação direcionada.

- [ ] **Step 3: Inspect final changes**

Run: `git diff --check HEAD~5..HEAD && git status --short`

Expected: sem espaços inválidos e árvore limpa depois dos commits.

- [ ] **Step 4: Request authorization before remote deployment**

Depois de revisão final e apenas com autorização explícita, aplicar:

```bash
npx supabase db push
npx supabase functions deploy get-admin-dashboard
npx supabase functions deploy get-admin-users
npx supabase functions deploy stripe-webhook
```

Não executar esses comandos antes da autorização: eles alteram o projeto Supabase remoto.

