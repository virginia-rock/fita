# Professional Link Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Complete the professional/student account-link experience with consent, controlled data access, unlink requests, real plan enforcement, private photos, and reports.

**Architecture:** The student's existing Fita data row and private files remain the only copies. Link metadata and per-entry provenance let server-side RPCs filter the professional view; RLS blocks a linked student from directly changing data. Stripe entitlement is authoritative for professional capability, and database functions atomically enforce capacity and a 72-hour unlink timeout.

**Tech Stack:** React 19, TanStack Router, TypeScript, Tailwind, Supabase Postgres/RLS/RPC/Storage/Cron, Stripe, Node test runner.

**Spec:** docs/superpowers/specs/2026-09-24-professional-link-completion-design.md

## Global Constraints

- Every student is an authenticated Fita user; do not create a student-without-account model.
- Student data and photo objects belong to the student; professional access is authorization, never a copy.
- The backend, rather than React state, enforces authorization, capacity and visibility.
- A linked student may view professional follow-up even on individual Free.
- An inactive professional plan makes the workspace read-only but does not end links.
- Pending invitations and active/unlink-requested links count against plan capacity: Personal 10, Personal Pro 30, Studio 100.
- An unlink request ends only on professional acceptance or 72-hour timeout and can be canceled by the student first.
- Preserve the existing untracked docs/Fita_Plano_Implantacao_Pricing_e_Painel_Profissional.md.

## Review Focus

- Concurrent invitations must not exceed the current Stripe plan capacity; Task 1.
- A professional must not read earlier entries when sharing was denied; Task 2.
- An inactive professional must not mutate a student by direct RPC call; Task 2.
- A timeout must be idempotent when the scheduler retries; Task 3.
- A linked student must not bypass navigation by directly upserting fita_data; Tasks 2 and 3.

---

## File Structure

- supabase/migrations/20260925000000_complete_professional_links.sql: additive database schema, RLS and RPCs.
- supabase/functions/process-professional-unlinks/index.ts: secured scheduled timeout endpoint.
- src/lib/professional-link-policy.ts: pure student/professional capability rules.
- src/lib/professional-link-api.ts: typed browser RPC boundary.
- src/components/ProfessionalLinkNotice.tsx: invitation and unlink dialogs.
- src/components/AppShell.tsx and routes app, nova, cronologia: linked-student navigation and direct-route guards.
- src/routes/profissional.tsx: entitlement-driven professional dashboard.
- src/lib/professional-photos.ts and src/components/ProfessionalEvaluationForm.tsx: private photo and assessment features.
- tests/professional-*.test.mjs: pure, schema and route-contract tests.

### Task 1: Add consented invitations, real link state, and capacity controls

**Files:**
- Create: supabase/migrations/20260925000000_complete_professional_links.sql
- Create: src/lib/professional-link-policy.ts
- Modify: src/lib/professional-links.ts
- Modify: src/lib/professional-link-api.ts
- Create: tests/professional-link-policy.test.mjs
- Modify: tests/professional-links-schema.test.mjs
- Modify: tests/professional-link-api.test.mjs

**Interfaces:**
- Produces link states active, unlink_requested and ended.
- Produces studentLinkCapabilities(link, individualCloudAccess).
- Produces professionalLinkCapabilities(entitlement, link).
- Produces list_student_professional_invitations() and respond_to_professional_invitation(token, accept, share_prior_history).

- [ ] **Step 1: Write failing policy and SQL contract tests**

~~~js
test("active link hides self-entry navigation but permits follow-up viewing", () => {
  assert.deepEqual(studentLinkCapabilities({ status: "active" }, false), {
    canCreateEntries: false, canViewProfessionalFollowUp: true, visibleNav: ["/app"],
  });
});
test("inactive professional entitlement is read only", () => {
  assert.deepEqual(professionalLinkCapabilities({ status: "canceled" }, { status: "active" }), {
    canRead: true, canWrite: false, canGenerateReport: false,
  });
});
for (const text of [
  "share_prior_history boolean not null",
  "status in ('pending', 'accepted', 'declined', 'expired', 'revoked')",
  "function public.list_student_professional_invitations",
  "function public.respond_to_professional_invitation",
  "for update",
]) assert.match(sql, new RegExp(text.replace(/[()]/g, "\\$&"), "i"));
~~~

Add an assertion requiring a capacity count over pending invitations plus active/unlink-requested links before insert.

- [ ] **Step 2: Run the tests to prove they are red**

Run: node --experimental-strip-types --test tests/professional-link-policy.test.mjs tests/professional-links-schema.test.mjs tests/professional-link-api.test.mjs

Expected: FAIL because the policy module, migration and response RPC do not exist.

- [ ] **Step 3: Implement the policy and additive migration**

Create policy functions with this behavior:

~~~ts
export function studentLinkCapabilities(link: { status: string } | null, cloud: boolean) {
  if (link?.status === "active" || link?.status === "unlink_requested")
    return { canCreateEntries: false, canViewProfessionalFollowUp: true, visibleNav: ["/app"] };
  return { canCreateEntries: true, canViewProfessionalFollowUp: cloud, visibleNav: ["/app", "/nova", "/cronologia"] };
}
export function professionalLinkCapabilities(entitlement: { status: string } | null, link: { status: string }) {
  const canRead = link.status === "active" || link.status === "unlink_requested";
  const paid = entitlement?.status === "active" || entitlement?.status === "pending";
  return { canRead, canWrite: canRead && paid, canGenerateReport: canRead && paid };
}
~~~

Do not edit the existing applied professional-links migration. The new migration replaces invitation validation to permit declined, adds share_prior_history boolean not null default true, and adds future unlink fields from Task 3.

Implement create_professional_invitation as security definer: lock caller entitlement/link rows, require active professional entitlement, count pending invitations and active/unlink-requested links, and raise Student limit reached at capacity. Implement list_student_professional_invitations to match only pending, unexpired invitations for auth.uid() email. Implement response RPC with locked token, exact recipient email and expiry validation; refusal only sets declined, while acceptance creates one active link and records sharing choice atomically.

- [ ] **Step 4: Add browser wrappers**

~~~ts
export const listStudentProfessionalInvitations = () => callRpc("list_student_professional_invitations");
export const respondToProfessionalInvitation = (token: string, accept: boolean, sharePriorHistory = false) =>
  callRpc("respond_to_professional_invitation", {
    invitation_token: token.trim(), accept_invitation: accept, share_prior_history: sharePriorHistory,
  });
~~~

Extend existing ProfessionalLink types with professional_name, share_prior_history and unlink fields. Keep old helper exports only as compatibility delegates.

- [ ] **Step 5: Verify and commit**

Run: node --experimental-strip-types --test tests/professional-link-policy.test.mjs tests/professional-links-schema.test.mjs tests/professional-link-api.test.mjs

Expected: PASS.

~~~bash
git add supabase/migrations/20260925000000_complete_professional_links.sql src/lib/professional-link-policy.ts src/lib/professional-links.ts src/lib/professional-link-api.ts tests/professional-link-policy.test.mjs tests/professional-links-schema.test.mjs tests/professional-link-api.test.mjs
git commit -m "feat: add consented professional invitations"
~~~

### Task 2: Secure data visibility, evaluations, and direct writes

**Files:**
- Modify: supabase/migrations/20260925000000_complete_professional_links.sql
- Modify: src/lib/professional-link-api.ts
- Modify: src/lib/supabase-data.ts
- Create: tests/professional-workspace-contract.test.mjs

**Interfaces:**
- Produces get_professional_student_workspace(link_id), filtered by sharing and provenance.
- Produces add_professional_evaluation(link_id, entry).
- Produces list_professional_students(page, page_size, filter).
- Produces a linked-student direct-write RLS block.

- [ ] **Step 1: Write failing authorization contract tests**

~~~js
assert.match(sql, /share_prior_history.*jsonb_array_elements/i);
assert.match(sql, /entry->'meta'->>'link_id'/i);
assert.match(sql, /not exists \(select 1 from public\.fita_professional_links/i);
assert.match(sql, /professional_user_id.*link_id.*source.*professional/is);
~~~

Also assert add_professional_evaluation checks active/pending professional entitlement and overwrites client meta fields.

- [ ] **Step 2: Run the contract tests to prove failure**

Run: node --test tests/professional-workspace-contract.test.mjs tests/professional-links-schema.test.mjs

Expected: FAIL because filtering and the new RLS policies are absent.

- [ ] **Step 3: Implement filtered server access**

Replace direct fita_data insert/update/delete policies: a student writes only when no own link has active or unlink_requested status. Preserve direct reads of own data.

Professional workspace RPC requires caller ownership of active/unlink-requested link. If share_prior_history is false, rebuild data.entries from only entries whose server-added meta.link_id equals target link. If true, return all entries. Exclude internal meta from returned JSON.

Evaluation RPC locks and verifies link, requires professional active/pending entitlement, ignores any client meta, and appends values plus server meta source=professional, link_id and professional_user_id into the student's existing JSON data. List RPC uses page >= 0, page size 1..50, filters all|active|pending|unlink_requested and returns no raw data blobs.

- [ ] **Step 4: Add typed client boundary and local guard**

~~~ts
export const listProfessionalStudents = (page = 0, pageSize = 25, filter = "all") =>
  callRpc("list_professional_students", { page, page_size: pageSize, filter });
export const addProfessionalEvaluation = (linkId: string, entry: { date: string; values: Record<string, number>; note?: string }) =>
  callRpc("add_professional_evaluation", { target_link_id: linkId, entry });
~~~

Reject invalid pagination/filter values before RPC. Add saveCloudData(data, { readOnly }) behavior that throws Professional link is read-only when true. This is UX protection; the database policy remains security authority.

- [ ] **Step 5: Verify and commit**

Run: node --experimental-strip-types --test tests/professional-workspace-contract.test.mjs tests/professional-links-schema.test.mjs tests/professional-link-api.test.mjs

Expected: PASS.

~~~bash
git add supabase/migrations/20260925000000_complete_professional_links.sql src/lib/professional-link-api.ts src/lib/supabase-data.ts tests/professional-workspace-contract.test.mjs tests/professional-links-schema.test.mjs tests/professional-link-api.test.mjs
git commit -m "feat: enforce professional data authorization"
~~~

### Task 3: Deliver unlink workflow and linked-student experience

**Files:**
- Modify: supabase/migrations/20260925000000_complete_professional_links.sql
- Create: supabase/functions/process-professional-unlinks/index.ts
- Create: supabase/functions/process-professional-unlinks/README.md
- Modify: src/lib/professional-link-api.ts
- Create: src/components/ProfessionalLinkNotice.tsx
- Modify: src/components/AppShell.tsx
- Modify: src/routes/app.tsx
- Modify: src/routes/nova.tsx
- Modify: src/routes/cronologia.tsx
- Create: tests/professional-unlink-contract.test.mjs
- Create: tests/student-professional-experience.test.mjs

**Interfaces:**
- Produces request_professional_unlink, cancel_professional_unlink_request, accept_professional_unlink and process_expired_professional_unlinks.
- Produces student notice/dialog states for invitation, active link, request and cancellation.

- [ ] **Step 1: Write the failing unlink and UI tests**

~~~js
for (const rpc of ["request_professional_unlink", "cancel_professional_unlink_request", "accept_professional_unlink", "process_expired_professional_unlinks"])
  assert.match(sql, new RegExp("function public\\." + rpc));
assert.match(sql, /interval '72 hours'/i);
assert.match(sql, /ended_reason.*timeout/is);
const notice = await readFile("src/components/ProfessionalLinkNotice.tsx", "utf8");
assert.match(notice, /Compartilhar meus registros anteriores/);
assert.match(notice, /Solicitar desvinculação/);
assert.match(notice, /Cancelar solicitação de desvínculo/);
~~~

Require ownership checks: student for request/cancel, professional for acceptance, overdue unlink_requested only for timeout, and zero changes on a second timeout run.

- [ ] **Step 2: Run tests to prove failure**

Run: node --experimental-strip-types --test tests/professional-unlink-contract.test.mjs tests/student-professional-experience.test.mjs

Expected: FAIL because RPCs, timeout function and notice do not exist.

- [ ] **Step 3: Implement state machine and scheduler endpoint**

Request changes only active own-student link to unlink_requested, sets requested time, due time now plus 72 hours, and checkbox audit flag. It does not change access yet. Cancel restores active and clears request fields. Acceptance is the professional's sole resolution and ends the link with accepted reason. Timeout ends only overdue unlink requests with timeout reason and returns changed count; it must be idempotent.

The endpoint accepts only Authorization Bearer CRON_SECRET, invokes the timeout RPC using service role, and returns processed count or safe 500 error.

~~~ts
export const requestProfessionalUnlink = (linkId: string, removeAccess: boolean) =>
  callRpc("request_professional_unlink", { target_link_id: linkId, remove_professional_access: removeAccess });
export const cancelProfessionalUnlinkRequest = (linkId: string) =>
  callRpc("cancel_professional_unlink_request", { target_link_id: linkId });
export const acceptProfessionalUnlink = (linkId: string) =>
  callRpc("accept_professional_unlink", { target_link_id: linkId });
~~~

- [ ] **Step 4: Implement student UI and guards**

Invitation modal has accept, decline, loading/error states and unchecked historical-sharing checkbox. Active Panel Geral notice names professional and exposes Solicitar desvinculação. The request dialog contains unchecked remove-access checkbox and successful copy: Sua solicitação foi enviada ao seu personal. Request state replaces it with cancellation dialog.

Use visibleNav from Task 1 in AppShell: linked users see only Painel Geral, with no Meu Personal tab. Direct visits to Nova Entrada and Cronologia render an AppShell guard linking to Painel Geral. App route includes notice and hides the empty-state New Entry CTA.

- [ ] **Step 5: Document schedule, verify and commit**

The scheduler README must require an hourly HTTP call with Authorization Bearer CRON_SECRET; CRON_SECRET is a Supabase function secret and never frontend configuration.

Run: node --experimental-strip-types --test tests/professional-unlink-contract.test.mjs tests/student-professional-experience.test.mjs tests/professional-link-policy.test.mjs

Expected: PASS.

~~~bash
git add supabase/migrations/20260925000000_complete_professional_links.sql supabase/functions/process-professional-unlinks src/lib/professional-link-api.ts src/components/ProfessionalLinkNotice.tsx src/components/AppShell.tsx src/routes/app.tsx src/routes/nova.tsx src/routes/cronologia.tsx tests/professional-unlink-contract.test.mjs tests/student-professional-experience.test.mjs
git commit -m "feat: add professional unlink workflow"
~~~

### Task 4: Replace demo professional workspace and add private assessments

**Files:**
- Modify: src/routes/profissional.tsx
- Modify: src/lib/professional-reports.ts
- Create: src/lib/professional-photos.ts
- Create: src/components/ProfessionalEvaluationForm.tsx
- Modify: supabase/migrations/20260925000000_complete_professional_links.sql
- Create: tests/professional-dashboard-data.test.mjs
- Modify: tests/professional-dashboard-contract.test.mjs
- Create: tests/professional-photos.test.mjs
- Modify: tests/professional-reports.test.mjs
- Modify: docs/profissional-aluno-fluxo.md

**Interfaces:**
- Produces entitlement-driven dashboard state loading|forbidden|readOnly|activePlan.
- Produces private photo upload/retrieval functions.
- Produces report eligibility canGenerateProfessionalReport(plan, entitlementStatus).

- [ ] **Step 1: Write dashboard, report and storage tests**

~~~js
const source = await readFile("src/routes/profissional.tsx", "utf8");
assert.doesNotMatch(source, /professionalPlan\("personal_pro"\)/);
assert.match(source, /entitlement\.plan/);
assert.equal(canGenerateProfessionalReport("professional_personal_pro", "canceled"), false);
assert.equal(canGenerateProfessionalReport("professional_studio", "active"), true);
assert.match(sql, /insert into storage\.buckets.*fita-professional-photos.*false/i);
assert.match(sql, /function public\.create_professional_evaluation_photo_upload/i);
~~~

Require no public storage object select policy, and that upload/retrieval validates link, plan and entry visibility. Add report assertion that photos are supplied only by authorized signed descriptors.

- [ ] **Step 2: Run tests to prove failure**

Run: node --experimental-strip-types --test tests/professional-dashboard-contract.test.mjs tests/professional-dashboard-data.test.mjs tests/professional-photos.test.mjs tests/professional-reports.test.mjs

Expected: FAIL because dashboard fixes Personal Pro and private photo contract is absent.

- [ ] **Step 3: Implement the real workspace**

Load signed-in entitlement and permit only three professional plan IDs; otherwise render Plano profissional necessário and no demo data. Use server-provided capacity, page/filter/search results, pending invitations and unlink markers. Inactive/canceled professional sees authorized data in read-only state but cannot invite, assess, upload or report. Unlink marker opens only Aceitar desvinculação confirmation then refreshes list.

Change report eligibility to Personal Pro/Studio with active/pending entitlement. Keep local demo only when Supabase is unconfigured.

- [ ] **Step 4: Implement private photos and complete assessment form**

Create private bucket fita-professional-photos and metadata table keyed by student_user_id, link_id, entry_id and object path. Do not grant direct authenticated object reads. Upload RPC validates active/unlink-requested link ownership and active/pending entitlement, creates metadata and emits signed upload URL. Retrieval validates student ownership or filtered professional visibility then emits short-lived signed URL.

Render measurement inputs from existing METRICS and METRIC_GROUPS, not a duplicate list. Form supports date, optional values, notes and front/side/back files. Save evaluation first and files second; retain the evaluation and identify retryable file if upload fails. Printable HTML report includes current/previous comparison, variations, authorized photos and print CSS; do not add server PDF generation.

- [ ] **Step 5: Update operational docs and verify**

Document invitation consent, sharing choice, student restrictions, inactive-plan read-only behavior, unlink cancellation/timeout and data ownership. Include commands:

~~~bash
npx supabase db push
npx supabase functions deploy process-professional-unlinks
npx supabase secrets set CRON_SECRET=<generated-secret>
~~~

Document hourly scheduled Authorization Bearer CRON_SECRET and two-account tests: decline, accept without sharing history, evaluation/photo, cancel request, accept request and timeout.

Run: node --experimental-strip-types --test tests/professional-*.test.mjs tests/entitlements-*.test.mjs tests/stripe-*.test.mjs

Expected: PASS.

Run: npm run lint

Expected: PASS.

Run: npm run build

Expected: PASS.

- [ ] **Step 6: Commit completed workspace**

~~~bash
git add src/routes/profissional.tsx src/lib/professional-reports.ts src/lib/professional-photos.ts src/components/ProfessionalEvaluationForm.tsx supabase/migrations/20260925000000_complete_professional_links.sql tests/professional-dashboard-contract.test.mjs tests/professional-dashboard-data.test.mjs tests/professional-photos.test.mjs tests/professional-reports.test.mjs docs/profissional-aluno-fluxo.md
git commit -m "feat: complete professional workspace"
~~~

## Plan Self-Review

- **Spec coverage:** Task 1 implements consent and capacity; Task 2 provides owned, filtered data access and secure writes; Task 3 implements student UI, unlink state and timeout; Task 4 implements entitlement dashboard, assessments, photos, reports, operations and full verification.
- **Placeholder scan:** Every task lists concrete files, interfaces, failure tests, implementation behavior, commands and commits.
- **Type consistency:** Client link states are active, unlink_requested and ended. Professional write/report capability always derives from active or pending entitlement.
- **Review focus:** Capacity race is Task 1; denied history and write bypass are Task 2; timeout retry is Task 3; inactive entitlement mutation is Tasks 2 and 4.

