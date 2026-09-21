# Fita Plans and Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a simple landing page, local-only demo access, simulated plans, authentication screens, and a simulated account area while preserving the existing measurement dashboard.

**Architecture:** Move the current dashboard from `/` to `/app` and make `/` a standalone landing route. Store demo identity, simulated entitlement, and session state in a focused local-storage module; keep these values explicitly non-authoritative so Stripe/Supabase can replace them later. Reuse the existing app shell and Radix Dialog primitives, with shared plan/auth/status components kept separate from route files.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router, Tailwind CSS, Radix Dialog, existing localStorage storage layer, sonner.

**Spec:** `docs/superpowers/specs/2026-09-21-fita-planos-e-landing-design.md`

## Global Constraints

- No real Stripe, Supabase, authentication, email confirmation, cloud persistence, or payment processing in this iteration.
- Local demo state is presentation-only and must never be treated as proof of payment or authorization.
- Keep import/export available for local and simulated paid states.
- Paid simulation: R$ 29,90 activates one month of cloud entitlement; R$ 19,90/month activates subscription access until simulated cancellation.
- The UI must explain that clearing browser data deletes local records.
- Preserve the GitHub link and existing visual language.
- Use semantic controls, associated labels, visible focus, clear errors, and responsive layouts.

## Review Focus

- Direct navigation to `/app`, `/entrar`, `/criar-conta`, and `/conta` must work after moving the dashboard route.
- Refreshing the browser must preserve the demo session and entitlement state without implying server authority.
- Invalid password confirmation and invalid login must remain on the form with readable correction feedback.
- Local-only users must see the data-loss warning and retain import/export access.
- A simulated one-time purchase must show a finite expiry while a simulated subscription must show active/canceled state.

### Task 1: Local demo membership and shared product primitives

**Files:**
- Create: `src/lib/demo-account.ts`
- Create: `src/components/LocalStorageNotice.tsx`
- Create: `src/components/PlanCard.tsx`
- Create: `src/components/MembershipStatus.tsx`
- Modify: `src/lib/storage.ts` only if a shared export/import hook needs a stable public interface.

**Interfaces:**
- `src/lib/demo-account.ts` exports `DEMO_ACCOUNT_KEY`, `DemoAccount`, `DemoPlan`, `DemoStatus`, `loadDemoAccount()`, `saveDemoAccount(account)`, `clearDemoAccount()`, and `createDemoAccount(email)`.
- `PlanCard` accepts `{ name, price, cadence, description, features, actionLabel, onAction }`.
- `MembershipStatus` accepts `{ account: DemoAccount | null, onCancelSubscription }`.
- `LocalStorageNotice` renders the local-storage warning and an optional `children` action area.

- [ ] Add the account and entitlement types with exact values `local | cloud_month | subscription` and `anonymous | pending | active | expired | canceled`.
- [ ] Implement safe JSON parsing in `loadDemoAccount()`; malformed or missing data returns `null` without throwing.
- [ ] Implement `createDemoAccount(email)` with a local demo id, `emailConfirmed: false`, `plan: "local"`, and `status: "anonymous"`.
- [ ] Implement `PlanCard` with accessible heading, price, cadence, feature list, and a native button.
- [ ] Implement `MembershipStatus` for anonymous, active one-month, active subscription, canceled, and expired states.
- [ ] Implement `LocalStorageNotice` with explicit copy that clearing browser data removes local measurements and with import/export actions supplied by the caller.
- [ ] Run `npx tsc --noEmit` and `npm run build`; both must pass.

### Task 2: Route the existing dashboard under `/app` and build the landing page

**Files:**
- Create: `src/routes/app.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/routeTree.gen.ts` through the project route-generation/build command, not by hand-editing unrelated entries.
- Create or modify: `src/components/LandingPage.tsx` if extracting the landing composition keeps `index.tsx` focused.

**Interfaces:**
- `/app` renders the current dashboard page behavior and `AppShell`.
- `/` renders the landing page and links to `/app`, `/entrar`, and plan selection.
- `AppShell` continues to expose import/export and the existing support modal, with the new local storage notice visible in the product shell.

- [ ] Move the current index dashboard component into the `/app` route without changing its measurement behavior.
- [ ] Replace `/` with a focused landing page: product promise, local-first explanation, storage-loss warning, “Testar sem cadastro”, “Apoiar o projeto”, and GitHub link.
- [ ] Add the two plan cards for R$ 29,90 one-time cloud month and R$ 19,90/month subscription.
- [ ] Link the landing CTAs to `/app`, `/criar-conta`, and a simulated plan-selection flow without opening a real payment provider.
- [ ] Preserve responsive header behavior and the GitHub icon link in the product shell.
- [ ] Verify direct `/app` and `/` navigation in the dev server and run `npx tsc --noEmit` plus `npm run build`.

### Task 3: Add simulated auth and checkout flows

**Files:**
- Create: `src/components/AuthForm.tsx`
- Create: `src/components/SimulatedCheckout.tsx`
- Create: `src/routes/entrar.tsx`
- Create: `src/routes/criar-conta.tsx`
- Create: `src/routes/checkout.tsx`
- Modify: `src/lib/demo-account.ts` to add `setDemoSession(account)`, `loadDemoSession()`, and `clearDemoSession()`.

**Interfaces:**
- `AuthForm` accepts `{ mode: "login" | "signup", onSubmit, submitting, error, confirmationMessage }`.
- `SimulatedCheckout` accepts `{ plan: "cloud_month" | "subscription", account, onComplete }` and never contacts a payment API.
- `/entrar` loads local demo session and routes successful demo login to `/conta`.
- `/criar-conta` validates email, password, and repeated password, then stores a demo account with a simulated confirmation state.
- `/checkout?plan=cloud_month|subscription` shows the selected plan and completes a simulated entitlement.

- [ ] Build labeled email/password/repeated-password fields with client-side validation and inline errors.
- [ ] Make login accept the locally stored demo account only, show a clear invalid-credentials state otherwise, and never claim server authentication.
- [ ] Make signup create the demo profile and show “confirmação enviada” as a simulated state before allowing checkout.
- [ ] Make checkout require a demo session, show a “pagamento simulado” label, and on confirmation set the correct plan/status/expiry locally.
- [ ] Add links between landing, signup, login, checkout, and account routes with the selected plan preserved in the URL.
- [ ] Test invalid confirmation, invalid login, each plan selection, and refresh persistence with `npx tsc --noEmit` and `npm run build`.

### Task 4: Add the simulated account page and complete shell integration

**Files:**
- Create: `src/routes/conta.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/MembershipStatus.tsx` if the account-specific actions need a focused variant.
- Modify: `README.md` with the local demo and simulated-payment limitation.

**Interfaces:**
- `/conta` reads the local demo session, renders the email and membership status, and provides simulated cancellation for subscriptions.
- `AppShell` links to `/conta` for a demo session and to `/entrar` otherwise.

- [ ] Render anonymous users with a clear login/create-account prompt rather than an empty dashboard.
- [ ] Render active one-time access with the simulated expiry and explain that cloud storage is not actually connected yet.
- [ ] Render active subscription with a simulated cancel action; cancellation changes only local demo state to `canceled`.
- [ ] Keep import/export available in the account area and point users back to `/app`.
- [ ] Add README copy clarifying that plans, login, payment, and cloud access are demonstrations only.
- [ ] Run the full verification set: `npx tsc --noEmit`, `npm run build`, `git diff --check`, and manual route/state checks for all review-focus cases.

## Final verification

- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Run `git diff --check`.
- Exercise `/`, `/app`, `/entrar`, `/criar-conta`, `/checkout?plan=cloud_month`, `/checkout?plan=subscription`, and `/conta` in the browser.
- Confirm no UI text says a real payment, email, authentication, or cloud synchronization occurred.
