# Stripe Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simulated Fita. checkout with a Stripe Checkout integration for the one-time R$ 29,90 plan and the recurring R$ 19,90/month plan, while keeping Supabase entitlements authoritative.

**Architecture:** The browser invokes a Supabase Edge Function with the authenticated Supabase JWT. `create-checkout-session` validates the paid plan and creates a hosted Stripe Checkout Session using server-only Price IDs. Stripe calls `stripe-webhook`, which verifies the raw request signature, deduplicates `event.id`, and writes Stripe-derived entitlement state through the Supabase service-role client. The existing frontend continues to read `fita_entitlements` through its current data boundary.

**Tech Stack:** React 19, TanStack Router, Supabase Edge Functions/Deno, Supabase Postgres migrations/RLS, Stripe Checkout and Billing webhooks, Node `node:test`, TypeScript, existing Tailwind UI.

**Spec:** `docs/superpowers/specs/2026-09-22-stripe-payments-design.md`

## Global Constraints

- Never expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or Stripe Price IDs through `VITE_` variables.
- The browser must never decide the amount, currency, Price ID, entitlement status, or expiration date.
- Use hosted Stripe Checkout with `mode=payment` for `cloud_month` and `mode=subscription` for `subscription`.
- Stripe webhooks, not the success redirect, are the source of payment fulfillment.
- Webhook processing must be idempotent by `event.id`.
- Keep `source = 'demo'` behavior working for existing local/demo flows; Stripe writes `source = 'stripe'`.
- Do not add taxes, discounts, coupons, or a billing portal in this change.
- Real secrets and Price IDs remain deployment configuration; committed files contain placeholders only.
- Do not rewrite or amend published Lovable history.

## Review Focus

- Duplicate Stripe delivery: a repeated `event.id` must return success without extending or overwriting the entitlement twice; covered in Task 4.
- Forged or malformed webhook: an invalid `Stripe-Signature` or unknown Price ID must be rejected without a database mutation; covered in Task 4.
- Client tampering: a browser-supplied plan outside `cloud_month | subscription` must not create a session; covered in Task 3.
- Delayed payment: `checkout.session.async_payment_succeeded` must activate the one-time plan, while `async_payment_failed` must not; covered in Task 4.
- Stripe subscription lifecycle: active, past-due/payment-failed, updated-period, and deleted events must map to stable entitlement states; covered in Task 4 and Task 5.

## File Map

- Create `supabase/migrations/20260922000000_add_stripe_billing.sql`: Stripe identifiers on `fita_entitlements` and idempotency table.
- Create `supabase/functions/_shared/stripe-config.ts`: closed paid-plan type and environment/Price-ID lookup shared by Edge Functions.
- Create `supabase/functions/create-checkout-session/index.ts`: authenticated server-side Checkout Session creation.
- Create `supabase/functions/stripe-webhook/index.ts`: signature verification, event routing, idempotent entitlement writes.
- Create `src/lib/stripe-checkout.ts`: typed browser client for invoking the Edge Function.
- Modify `src/routes/index.tsx`: start Stripe checkout for paid plans and preserve the existing group-contact action.
- Modify `src/routes/checkout.tsx` and `src/components/SimulatedCheckout.tsx`: replace simulation UI with configured/unconfigured Stripe checkout states.
- Modify `src/routes/conta.tsx` and/or `src/components/MembershipStatus.tsx`: avoid demo cancellation actions for Stripe-backed subscriptions and display the actual Stripe-backed state.
- Modify `.env.example`: add frontend and Edge Function configuration names with safe placeholders.
- Modify `README.md` and `gist.md`: document test-mode setup, webhook flow, and secret handling.
- Create `tests/stripe-config.test.mjs`: pure plan validation and Price-ID mapping tests.
- Create `tests/stripe-webhook.test.mjs`: pure event-to-entitlement mapping/idempotency contract tests.
- Create `tests/stripe-schema.test.mjs`: migration assertions for columns, constraints, RLS-compatible event storage, and uniqueness.

### Task 1: Define shared Stripe plan/config contracts

**Files:**
- Create: `supabase/functions/_shared/stripe-config.ts`
- Create: `tests/stripe-config.test.mjs`

**Interfaces:**
- Produces `type PaidPlan = "cloud_month" | "subscription"`.
- Produces `function parsePaidPlan(value: unknown): PaidPlan | null`.
- Produces `function priceIdForPlan(plan: PaidPlan, env: Record<string, string | undefined>): string` that throws when the configured Price ID is missing.
- Produces `function planForPriceId(priceId: string, env: Record<string, string | undefined>): PaidPlan | null`.

- [ ] **Step 1: Write failing tests for the closed plan and Price-ID mapping.**

  Assert that `cloud_month` and `subscription` are accepted, unknown strings and missing values return `null`, each configured Price ID maps to exactly one plan, and missing/duplicate configuration throws instead of silently selecting a price.

- [ ] **Step 2: Run the focused test and verify the expected failure.**

  Run: `node --experimental-strip-types --test tests/stripe-config.test.mjs`

  Expected: FAIL because `supabase/functions/_shared/stripe-config.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal pure config module.**

  Keep it free of Stripe SDK imports so it can be tested by Node and reused by both Edge Functions. Read only `STRIPE_PRICE_CLOUD_MONTH` and `STRIPE_PRICE_SUBSCRIPTION`; never accept a client-supplied Price ID.

- [ ] **Step 4: Run the focused test and verify it passes.**

  Run: `node --experimental-strip-types --test tests/stripe-config.test.mjs`

  Expected: all plan/config tests pass.

- [ ] **Step 5: Commit the contract.**

  Run: `git add tests/stripe-config.test.mjs supabase/functions/_shared/stripe-config.ts && git commit -m "feat: add Stripe plan configuration contract"`

### Task 2: Add the Stripe persistence and idempotency migration

**Files:**
- Create: `supabase/migrations/20260922000000_add_stripe_billing.sql`
- Create: `tests/stripe-schema.test.mjs`

**Interfaces:**
- Extends `public.fita_entitlements` with nullable Stripe identifiers and
  `current_period_end timestamptz`.
- Produces `public.fita_stripe_events(event_id text primary key, event_type text not null, processed_at timestamptz not null default timezone('utc', now()))`.
- Preserves the existing entitlement RLS/read behavior and does not grant event-table access to `anon` or `authenticated`.

- [ ] **Step 1: Write failing migration contract tests.**

  Read the migration as text and assert it adds `stripe_customer_id`, `stripe_subscription_id`, `stripe_checkout_session_id`, `stripe_price_id`, `current_period_end`, and `last_stripe_event_id`; creates the event table with a primary key; and revokes public/anon/authenticated access to the event table.

- [ ] **Step 2: Run the schema tests and verify they fail.**

  Run: `node --test tests/stripe-schema.test.mjs`

  Expected: FAIL because the new migration is absent.

- [ ] **Step 3: Write the migration.**

  Use `alter table ... add column if not exists` for the entitlement additions, create the idempotency table with `if not exists`, add an index on `stripe_subscription_id`, revoke table access from public roles, and keep admin/service-role access available to the webhook function. Do not add a client-write policy.

- [ ] **Step 4: Run the schema tests and the existing schema suite.**

  Run: `node --test tests/stripe-schema.test.mjs tests/entitlements-schema.test.mjs`

  Expected: all schema assertions pass.

- [ ] **Step 5: Commit the migration.**

  Run: `git add supabase/migrations/20260922000000_add_stripe_billing.sql tests/stripe-schema.test.mjs && git commit -m "feat: add Stripe billing persistence"`

### Task 3: Create the authenticated Checkout Session Edge Function

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`
- Create: `src/lib/stripe-checkout.ts`

**Interfaces:**
- Edge Function request JSON: `{ plan: PaidPlan }`.
- Edge Function response JSON on success: `{ url: string }`.
- Browser function: `createStripeCheckoutSession(plan: PaidPlan): Promise<{ url: string }>`.

- [ ] **Step 1: Add pure request-contract tests to `tests/stripe-config.test.mjs`.**

  Cover rejecting unauthenticated requests, rejecting unknown plan values, selecting the configured Price ID server-side, and including `supabase_user_id` plus `plan` in Checkout Session metadata.

- [ ] **Step 2: Run the focused tests and verify the new contract fails.**

  Run: `node --experimental-strip-types --test tests/stripe-config.test.mjs`

  Expected: FAIL because the Edge Function contract is not implemented.

- [ ] **Step 3: Implement the Edge Function.**

  Create a Supabase client with the request bearer token and `SUPABASE_ANON_KEY`, call `auth.getUser()`, parse JSON, validate with `parsePaidPlan`, resolve the Price ID with `priceIdForPlan`, and create a hosted Checkout Session using the Stripe SDK. Use `client_reference_id = user.id`, `customer_email = user.email` when present, `success_url = ${PUBLIC_APP_URL}/conta?stripe=success&session_id={CHECKOUT_SESSION_ID}`, `cancel_url = ${PUBLIC_APP_URL}/checkout?plan=${plan}&stripe=cancelled`, and `line_items = [{ price: priceId, quantity: 1 }]`. Use `mode = "payment"` for `cloud_month` and `mode = "subscription"` for `subscription`.

- [ ] **Step 4: Implement the browser wrapper and checkout error contract.**

  Call `supabase.functions.invoke("create-checkout-session", { body: { plan } })`, throw a user-safe error for missing configuration or a non-2xx function response, and return the URL without logging tokens or full error payloads.

- [ ] **Step 5: Run type/lint checks for the new interfaces.**

  Run: `npm run lint`

  Expected: no lint errors.

- [ ] **Step 6: Commit the session flow.**

  Run: `git add supabase/functions/create-checkout-session/index.ts src/lib/stripe-checkout.ts tests/stripe-config.test.mjs && git commit -m "feat: create Stripe Checkout sessions"`

### Task 4: Create the signed, idempotent Stripe webhook

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`
- Create: `tests/stripe-webhook.test.mjs`

**Interfaces:**
- Webhook input: raw request body plus `Stripe-Signature` header.
- Pure event mapper: `mapStripeEventToEntitlement(event, config)` returning an explicit mutation or `null`.
- Mutation fields: `userId`, `plan`, `status`, `expiresAt`, `currentPeriodEnd`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeCheckoutSessionId`, `stripePriceId`.

- [ ] **Step 1: Write failing mapper/idempotency tests.**

  Add fixtures for `checkout.session.completed` in payment and subscription modes, `checkout.session.async_payment_succeeded`, async failure, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Assert unknown prices and missing metadata return `null`, duplicate event IDs are ignored, one-time access expires 30 days after the confirmed session completion, and recurring status/period fields are preserved.

- [ ] **Step 2: Run the webhook tests and verify failure.**

  Run: `node --test tests/stripe-webhook.test.mjs`

  Expected: FAIL because the mapper is not implemented.

- [ ] **Step 3: Implement the pure event mapper.**

  Keep event-to-mutation logic separate from HTTP and Supabase calls. Use metadata for the Supabase user ID on Checkout events, use the stored subscription/customer IDs for lifecycle events, map Stripe `active`/`trialing` to `active`, `past_due`/`incomplete`/`unpaid` to `pending`, and deleted status to `canceled`. For `invoice.paid`, update only a matching Stripe subscription entitlement.

- [ ] **Step 4: Implement the signed webhook handler.**

  Read the raw body exactly once, call `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`, insert `event.id` into `fita_stripe_events` before applying the mutation, and return 200 for already-processed IDs. Use the Supabase service-role client for the event insert and entitlement upsert. Return 400 for signature/JSON/event errors and 500 for database failures so Stripe retries transient failures.

- [ ] **Step 5: Run the webhook and full pure-test suites.**

  Run: `node --test tests/stripe-webhook.test.mjs tests/stripe-config.test.mjs tests/stripe-schema.test.mjs tests/entitlements-schema.test.mjs tests/entitlements-data.test.mjs tests/entitlements-flow.test.mjs`

  Expected: all tests pass.

- [ ] **Step 6: Commit the webhook.**

  Run: `git add supabase/functions/stripe-webhook/index.ts tests/stripe-webhook.test.mjs && git commit -m "feat: sync entitlements from Stripe webhooks"`

### Task 5: Replace the simulated checkout UI and protect account state

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/checkout.tsx`
- Modify: `src/components/SimulatedCheckout.tsx` or replace it with `src/components/StripeCheckout.tsx`
- Modify: `src/routes/conta.tsx`
- Modify: `src/components/MembershipStatus.tsx`
- Create: `tests/stripe-checkout-ui.test.mjs` if the repository adds a component test runner; otherwise cover the pure browser wrapper contract in `tests/stripe-config.test.mjs`.

**Interfaces:**
- Paid-plan buttons call `createStripeCheckoutSession(plan)` and redirect only to the returned Stripe URL.
- Checkout states are `idle`, `redirecting`, `configuration_error`, and `request_error`.

- [ ] **Step 1: Add a failing pure state test for missing configuration and duplicate clicks.**

  Assert that a missing `url` or function error renders a recoverable error and that a second click while redirecting cannot invoke a second session request.

- [ ] **Step 2: Run the focused test and verify failure.**

  Run: `node --test tests/stripe-checkout-ui.test.mjs`

  Expected: FAIL until the simulated UI is replaced.

- [ ] **Step 3: Replace simulated completion with Stripe redirect behavior.**

  Keep the plan copy and account context, remove “pagamento simulado” and `activateDemoEntitlement` from the production payment path, call the browser wrapper, set a stable busy label without changing button dimensions, and assign `window.location.href` only after receiving a validated Stripe URL.

- [ ] **Step 4: Update the landing plan actions.**

  Preserve the group-contact card and account gate. For authenticated users, route paid plans to `/checkout?plan=...`; for unauthenticated users, retain the existing account creation flow.

- [ ] **Step 5: Update account subscription behavior.**

  Render Stripe-backed status from the remote entitlement. Do not call `cancelDemoEntitlement` when `source === "stripe"`; show that Stripe-backed cancellation is not available in this placeholder release rather than falsely canceling a local demo entitlement.

- [ ] **Step 6: Exercise keyboard, error, busy, success-return, and narrow viewport states in the browser.**

  Verify the modal/checkout focus behavior, no duplicate submission, the missing-secret placeholder error, and that a `stripe=success` return does not grant access before the webhook updates Supabase.

- [ ] **Step 7: Commit the frontend flow.**

  Run: `git add src/routes/index.tsx src/routes/checkout.tsx src/components/SimulatedCheckout.tsx src/routes/conta.tsx src/components/MembershipStatus.tsx tests/stripe-checkout-ui.test.mjs && git commit -m "feat: connect checkout UI to Stripe"`

### Task 6: Add deployment configuration and operational documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `gist.md`
- Create: `supabase/functions/create-checkout-session/README.md`
- Create: `supabase/functions/stripe-webhook/README.md`

- [ ] **Step 1: Add safe placeholders to `.env.example`.**

  Document only names and non-secret examples: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `PUBLIC_APP_URL`, and the Edge Function secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CLOUD_MONTH`, `STRIPE_PRICE_SUBSCRIPTION`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 2: Document test-mode setup.**

  Explain creating two Stripe Prices in BRL, setting Supabase secrets, applying migrations, deploying both functions, registering the webhook endpoint, and using Stripe CLI `stripe listen --forward-to .../functions/v1/stripe-webhook` with test keys. State clearly that the secret key and service-role key must never be committed or prefixed with `VITE_`.

- [ ] **Step 3: Document the fulfillment contract.**

  Update README and gist to state that Stripe webhook processing is authoritative, redirects are not fulfillment, the one-time plan lasts 30 days, and the subscription follows Stripe lifecycle events.

- [ ] **Step 4: Run documentation and diff checks.**

  Run: `git diff --check`

  Expected: no whitespace errors and no secret values in the diff.

- [ ] **Step 5: Commit the operational docs.**

  Run: `git add .env.example README.md gist.md supabase/functions/create-checkout-session/README.md supabase/functions/stripe-webhook/README.md && git commit -m "docs: document Stripe deployment setup"`

### Task 7: Apply, deploy, and verify in Stripe test mode

**Files:**
- Modify: Supabase project configuration outside the repository via the approved deployment workflow.

- [ ] **Step 1: Apply the new migration to the connected Supabase project.**

  Confirm the new columns, `fita_stripe_events`, index, and access grants exist before deploying functions.

- [ ] **Step 2: Configure secrets and placeholders in the deployment environment.**

  Set the real test-mode values for every variable from Task 6; do not place them in tracked files or terminal output.

- [ ] **Step 3: Deploy both Edge Functions.**

  Deploy `create-checkout-session` and `stripe-webhook`, then register the webhook URL for the event list from the spec.

- [ ] **Step 4: Run the end-to-end test matrix.**

  Complete one test payment and one test subscription with Stripe test cards; verify the corresponding entitlement, repeat a webhook delivery to confirm idempotency, simulate invoice failure and subscription deletion, and verify that access changes without deleting measurement data.

- [ ] **Step 5: Run the final repository checks.**

  Run: `node --test tests/*.test.mjs`, `npm run lint`, `npm run build`, and `git diff --check`.

  Expected: all tests pass, lint/build exit 0, and no secrets appear in tracked files.

## Execution Order

Execute Tasks 1–4 first because they establish the server/data contracts. Execute
Task 5 after the functions and pure mappings are green. Execute Task 6 before
deployment. Execute Task 7 only after the user supplies the real Stripe test
configuration and explicitly asks to deploy/apply it.

## Handoff

This plan deliberately prepares production code and test-mode deployment steps,
but it does not apply migrations, set secrets, or deploy functions without an
explicit deployment request and the required Stripe/Supabase values.
