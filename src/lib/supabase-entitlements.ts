import type { DemoPlan } from "./demo-account";
import {
  isCloudEntitled,
  parseEntitlement,
  type Entitlement,
} from "./entitlements";
import { supabase } from "./supabase";

const TABLE = "fita_entitlements";

export { isCloudEntitled, parseEntitlement };
export type { Entitlement };

export async function loadEntitlement(): Promise<Entitlement | null> {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id, plan, status, expires_at, source")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return parseEntitlement(data);
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
