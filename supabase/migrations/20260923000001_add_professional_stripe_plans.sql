-- Stripe prices are configured with environment variables in the Edge Functions.
-- The entitlement table accepts their stable product identifiers.

alter table public.fita_entitlements
  drop constraint if exists fita_entitlements_plan_check;

alter table public.fita_entitlements
  add constraint fita_entitlements_plan_check check (
    plan in (
      'local', 'cloud_month', 'subscription', 'subscription_monthly',
      'subscription_annual', 'professional_personal',
      'professional_personal_pro', 'professional_studio'
    )
  );
