# Fita Insider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement private Insider offers with database-controlled eligibility, authenticated Stripe Checkout, a 90-day trial, lifetime 30% pricing, webhook-backed entitlement state, and account cancellation.

**Architecture:** Keep public plans unchanged. Store eligibility in `fita_insider_access`, keep paid access in `fita_entitlements`, and connect both transactionally from Stripe webhook events. The browser requests an Insider Checkout Session and cancellation through authenticated Edge Functions; it never chooses a Price ID or grants itself access.

**Tech Stack:** React 19, TanStack Router, Supabase Postgres/RLS, Supabase Edge Functions on Deno, Stripe Checkout/subscriptions/webhooks, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-24-fita-insider-design.md`

## Global Constraints

- Insider offers are not rendered in the public landing page.
- Secrets are `FITA_PRO_MONTHLY_INSIDER` and `FITA_PERSONAL_INSIDER`; their values are real Stripe Price IDs.
- The server applies `trial_period_days: 90` and sends `supabase_user_id`, `plan`, and `insider_offer` metadata.
- The Stripe webhook is authoritative; a Checkout return alone never grants access.
- `fita_entitlements.stripe_price_id` stores Stripe Price IDs, never secret names.
- Cancellation requires authenticated ownership validation and an app-owned confirmation dialog.
- Preserve unrelated working-tree changes and do not rewrite published history.

## Review Focus

- A user without an eligible Insider row cannot create a session — covered in the Checkout Function contract test.
- A canceled or already-active Insider row cannot create a second session — covered in the same function tests.
- Trial Checkout with `payment_status = no_payment_required` activates the entitlement — covered in the Stripe mapper/webhook tests.
- Later subscription/invoice events retain the Insider offer and trial end — covered in webhook mapping tests.
- A user cannot cancel another user’s subscription — covered in the cancellation function contract test.

### Task 1: Add Insider data model and domain parsing

**Files:**
- Create: `supabase/migrations/20260924000000_create_fita_insider_access.sql`
- Modify: `src/lib/entitlements.ts`
- Modify: `src/lib/supabase-entitlements.ts`
- Create: `src/lib/insider.ts`
- Test: `tests/insider-data.test.mjs`

**Interfaces:**
- `InsiderOffer = "pro_monthly" | "personal"`.
- `InsiderAccessStatus = "eligible" | "active" | "canceled"`.
- `InsiderAccess = { user_id, offer, status, selected_at, claimed_at, trial_ends_at, stripe_customer_id, stripe_subscription_id }`.
- `loadInsiderAccess(): Promise<InsiderAccess | null>` reads only the authenticated user’s row.
- `parseInsiderAccess(value: unknown): InsiderAccess | null` rejects malformed data.
- Extend `Entitlement` with nullable `insider_offer` and `trial_ends_at`.

- [ ] **Step 1: Write failing parser and migration-contract tests**

Assert valid `pro_monthly` and `personal` rows parse, unknown offers/statuses are rejected, and the migration contains the table, checks, RLS, owner-only select policy, and entitlement columns.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test tests/insider-data.test.mjs`

Expected: FAIL because the parser, migration, and new fields do not exist.

- [ ] **Step 3: Add the migration and domain types**

Create the table with a primary key on `user_id`, checks for `offer` and `status`, timestamps, Stripe identifiers, `updated_at` trigger, RLS, and an authenticated self-read policy. Add `insider_offer` and `trial_ends_at` to `fita_entitlements` with checks. Implement the parser and extend `loadEntitlement`’s select list.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test tests/insider-data.test.mjs tests/entitlements-data.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the data-model slice**

```bash
git add supabase/migrations/20260924000000_create_fita_insider_access.sql src/lib/entitlements.ts src/lib/supabase-entitlements.ts src/lib/insider.ts tests/insider-data.test.mjs
git commit -m "feat: add insider access data model"
```

### Task 2: Extend Stripe price mapping and event contracts

**Files:**
- Modify: `supabase/functions/_shared/stripe-config.ts`
- Modify: `supabase/functions/_shared/stripe-event-mapper.ts`
- Modify: `supabase/functions/_shared/checkout-contract.ts`
- Modify: `supabase/functions/_shared/webhook-contract.ts` only if shared types require it
- Modify: `tests/stripe-config.test.mjs`
- Modify: `tests/stripe-webhook.test.mjs`

**Interfaces:**
- `InsiderOffer = "pro_monthly" | "personal"` shared in the Edge Function layer.
- `StripePriceConfig = { plan: PaidPlan; insiderOffer: InsiderOffer | null }`.
- `priceConfigForId(priceId, env): StripePriceConfig | null` maps standard and Insider Price IDs.
- `StripeEntitlementMutation` gains `insiderOffer` and `trialEndsAt`.

- [ ] **Step 1: Write failing tests for Insider Price IDs and trial events**

Add `FITA_PRO_MONTHLY_INSIDER` and `FITA_PERSONAL_INSIDER` to test env fixtures. Assert they map to `subscription_monthly`/`professional_personal` with the correct Insider offer. Add a Checkout Session fixture with `payment_status: "no_payment_required"`, `trial_end`, and Insider metadata; assert the mutation is active and preserves `trialEndsAt`.

- [ ] **Step 2: Run focused tests and verify the expected failures**

Run: `node --test tests/stripe-config.test.mjs tests/stripe-webhook.test.mjs`

Expected: FAIL because the new secrets and mutation fields are not supported.

- [ ] **Step 3: Implement the price configuration and mapper changes**

Keep standard plan behavior unchanged. Add Insider config entries, return the richer config from `priceConfigForId`, preserve `planForPriceId` as a compatibility wrapper, accept `paid` and `no_payment_required` for successful Checkout, derive `trialEndsAt` from `trial_end`, and carry Insider metadata through subscription/invoice events.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test tests/stripe-config.test.mjs tests/stripe-webhook.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the Stripe contract slice**

```bash
git add supabase/functions/_shared/stripe-config.ts supabase/functions/_shared/stripe-event-mapper.ts supabase/functions/_shared/checkout-contract.ts tests/stripe-config.test.mjs tests/stripe-webhook.test.mjs
git commit -m "feat: map insider Stripe prices"
```

### Task 3: Implement authenticated Insider Checkout and cancellation

**Files:**
- Create: `supabase/functions/create-insider-checkout-session/index.ts`
- Create: `supabase/functions/cancel-stripe-subscription/index.ts`
- Modify: `supabase/migrations/20260924000000_create_fita_insider_access.sql`
- Create: `tests/insider-checkout.test.mjs`
- Create: `tests/insider-cancellation.test.mjs`

**Interfaces:**
- `create-insider-checkout-session` accepts no client-selected offer; it reads the authenticated user’s `fita_insider_access` row.
- `cancel-stripe-subscription` accepts no client-selected subscription; it reads the authenticated user’s entitlement and verifies `stripe_subscription_id` ownership.

- [ ] **Step 1: Write failing tests for eligibility, trial, metadata, and ownership**

Test that an authenticated eligible user receives a session using the correct Insider secret, recurring mode, 90-day trial, base plan metadata, and Insider metadata. Test missing, active, and canceled eligibility return safe 4xx responses. Test cancellation rejects absent or mismatched ownership and calls Stripe only for the authenticated user’s subscription.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test tests/insider-checkout.test.mjs tests/insider-cancellation.test.mjs`

Expected: FAIL because both Edge Functions do not exist.

- [ ] **Step 3: Implement `create-insider-checkout-session`**

Follow the existing function’s auth/CORS/error pattern. Use service role to read the eligibility row, map `pro_monthly` to `FITA_PRO_MONTHLY_INSIDER` and `subscription_monthly`, map `personal` to `FITA_PERSONAL_INSIDER` and `professional_personal`, and create a Stripe subscription Checkout Session with `trial_period_days: 90`, metadata on the session and `subscription_data`, and `/conta?stripe=success`/cancel URLs.

- [ ] **Step 4: Implement `cancel-stripe-subscription`**

Require the authenticated user, load their entitlement, reject missing or canceled subscriptions, retrieve the Stripe subscription, verify its customer/subscription identifiers match the entitlement, cancel it immediately, and return a safe status. The webhook remains responsible for the final database transition.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `node --test tests/insider-checkout.test.mjs tests/insider-cancellation.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the Edge Function slice**

```bash
git add supabase/functions/create-insider-checkout-session supabase/functions/cancel-stripe-subscription tests/insider-checkout.test.mjs tests/insider-cancellation.test.mjs
git commit -m "feat: add insider checkout and cancellation"
```

### Task 4: Make webhook updates transactional for Insider state

**Files:**
- Modify: `supabase/migrations/20260924000000_create_fita_insider_access.sql`
- Modify: `supabase/functions/stripe-webhook/index.ts`
- Modify: `tests/stripe-schema.test.mjs`
- Modify: `tests/stripe-webhook.test.mjs`

**Interfaces:**
- `apply_stripe_entitlement_event` accepts `p_insider_offer` and `p_trial_ends_at` and updates both tables atomically.
- Existing standard Stripe events continue to pass null Insider arguments.

- [ ] **Step 1: Write failing SQL-contract and webhook-state tests**

Assert the migration updates the RPC signature and transaction with Insider fields. Assert successful Insider checkout creates active Insider state, invoice events preserve it, and subscription deletion marks both entitlement and Insider state canceled.

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --test tests/stripe-schema.test.mjs tests/stripe-webhook.test.mjs`

Expected: FAIL because the RPC contract does not yet include Insider state.

- [ ] **Step 3: Extend the migration RPC and webhook call**

Add the two parameters, validate Insider offer/base-plan consistency, update `fita_entitlements`, and update `fita_insider_access` only for the matching user/subscription. Preserve event idempotency and standard plans.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test tests/stripe-schema.test.mjs tests/stripe-webhook.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the webhook slice**

```bash
git add supabase/migrations/20260924000000_create_fita_insider_access.sql supabase/functions/stripe-webhook/index.ts tests/stripe-schema.test.mjs tests/stripe-webhook.test.mjs
git commit -m "feat: persist insider webhook state"
```

### Task 5: Add the Insider experience to the account panel

**Files:**
- Modify: `src/lib/insider.ts`
- Modify: `src/lib/supabase-entitlements.ts`
- Modify: `src/components/MembershipStatus.tsx`
- Modify: `src/routes/conta.tsx`
- Modify: `src/lib/stripe-checkout.ts`
- Create: `src/components/InsiderOfferCard.tsx`
- Create: `tests/insider-copy.test.mjs`

**Interfaces:**
- `createInsiderCheckoutSession(): Promise<{ url: string }>` invokes the authenticated function.
- `cancelStripeSubscription(): Promise<void>` invokes the authenticated cancellation function.
- `InsiderOfferCard` accepts an eligible `InsiderAccess` and an `onStart` callback.
- `MembershipStatus` accepts optional `insiderOffer`, `trialEndsAt`, and `onCancelStripeSubscription` props.

- [ ] **Step 1: Write failing copy/state tests**

Assert the offer card copy includes the 90-day trial and lifetime 30% discount, active state exposes the Insider label and trial date, and canceled state does not expose the active cancellation action.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/insider-copy.test.mjs`

Expected: FAIL because the new component/state helpers do not exist.

- [ ] **Step 3: Add client functions and load Insider state**

Fetch `fita_insider_access` alongside the entitlement. Add the two Supabase Function invocations with strict URL/error handling and preserve the existing public checkout API.

- [ ] **Step 4: Render the eligible Insider card**

Show the private offer only when status is `eligible`. The CTA starts the server-created session and preserves stable button dimensions during redirect. Do not add Insider cards to `src/routes/index.tsx`.

- [ ] **Step 5: Render active and canceled Insider states**

Show the `INSIDER` badge, base plan name, trial end date, and “Cancelar assinatura” for an active Insider subscription. Use the app-owned alert dialog before cancellation. On canceled state, show Free presentation and the existing public upgrade path.

- [ ] **Step 6: Run focused tests and verify they pass**

Run: `node --test tests/insider-copy.test.mjs tests/membership-status.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the account experience slice**

```bash
git add src/lib/insider.ts src/lib/supabase-entitlements.ts src/components/MembershipStatus.tsx src/components/InsiderOfferCard.tsx src/routes/conta.tsx src/lib/stripe-checkout.ts tests/insider-copy.test.mjs
git commit -m "feat: show insider offer in account"
```

### Task 6: Document secrets, admin operations, deploy, and full verification

**Files:**
- Modify: `.env.example`
- Modify: `supabase/functions/create-checkout-session/README.md`
- Create: `supabase/functions/create-insider-checkout-session/README.md`
- Create: `docs/insider-admin.md`
- Modify: `tests/stripe-config.test.mjs`

- [ ] **Step 1: Add configuration and admin documentation**

Document `FITA_PRO_MONTHLY_INSIDER` and `FITA_PERSONAL_INSIDER` as Price ID secrets, the SQL used to select users, the requirement that the prices be recurring with the intended 30% discount, and the fact that no SQL update to existing `stripe_price_id` rows is needed.

- [ ] **Step 2: Configure deployed Supabase secrets**

Set the two new secrets with the actual Stripe Price IDs from the supplied Payment Links’ products/prices, deploy the three changed functions, and keep the old standard secrets untouched. Do not print secret values in logs or commit them.

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
node --test tests/*.test.mjs
npx eslint supabase/functions/_shared/stripe-config.ts supabase/functions/_shared/stripe-event-mapper.ts supabase/functions/create-insider-checkout-session supabase/functions/cancel-stripe-subscription src/components/InsiderOfferCard.tsx src/components/MembershipStatus.tsx src/routes/conta.tsx
npm run build
git diff --check
```

Expected: all tests pass, targeted lint passes, build completes, and diff check is clean. Record any repository-wide pre-existing lint failures separately.

- [ ] **Step 4: Commit the documentation/configuration slice**

```bash
git add .env.example supabase/functions/create-checkout-session/README.md supabase/functions/create-insider-checkout-session/README.md docs/insider-admin.md tests/stripe-config.test.mjs
git commit -m "docs: configure insider operations"
```
