import type { DemoPlan } from "./demo-account";
import { parseInsiderAccess, type InsiderAccess } from "./insider";
import { isCloudEntitled, parseEntitlement, type Entitlement } from "./entitlements";
import { supabase } from "./supabase";

const TABLE = "fita_entitlements";

export { isCloudEntitled, parseEntitlement };
export type { Entitlement };
export type { InsiderAccess };

export async function loadEntitlement(): Promise<Entitlement | null> {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id, plan, status, expires_at, source, insider_offer, trial_ends_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return parseEntitlement(data);
}

export async function loadInsiderAccess(): Promise<InsiderAccess | null> {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("fita_insider_access")
    .select(
      "user_id, offer, status, selected_at, claimed_at, trial_ends_at, stripe_customer_id, stripe_subscription_id",
    )
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return parseInsiderAccess(data);
}

export async function loadAdminAccess(): Promise<boolean> {
  if (!supabase) return false;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return false;
  const { data, error } = await supabase
    .from("fita_admin_access")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.role === "admin";
}

export async function activateDemoEntitlement(
  plan: Exclude<DemoPlan, "local">,
): Promise<Entitlement> {
  if (!supabase) throw new Error("Supabase não está configurado.");

  const { data, error } = await supabase.rpc("activate_demo_entitlement", {
    target_plan: plan,
  });
  if (error) throw error;

  const entitlement = parseEntitlement(data);
  if (!entitlement) throw new Error("O Supabase retornou um entitlement inválido.");
  return entitlement;
}

export async function cancelDemoEntitlement(): Promise<Entitlement> {
  if (!supabase) throw new Error("Supabase não está configurado.");

  const { data, error } = await supabase.rpc("cancel_demo_entitlement");
  if (error) throw error;

  const entitlement = parseEntitlement(data);
  if (!entitlement) throw new Error("O Supabase retornou um entitlement inválido.");
  return entitlement;
}
