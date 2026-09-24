import { createClient } from "npm:@supabase/supabase-js@2";
import { classifyAdminUser, emptyAdminCounts } from "../_shared/admin-dashboard.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const requiredEnv = (name: string) => { const value = Deno.env.get(name)?.trim(); if (!value) throw new Error(`${name} is not configured.`); return value; };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
    const auth = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return json({ error: "Authentication required." }, 401);
    const admin = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const { data: access } = await admin.from("fita_admin_access").select("role").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
    if (!access) return json({ error: "Admin access required." }, 403);
    const users = [] as Array<{ id: string }>;
    for (let page = 1; ; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const { data: entitlements, error: entitlementError } = await admin.from("fita_entitlements").select("user_id, plan, status").in("user_id", users.map((user) => user.id));
    if (entitlementError) throw entitlementError;
    const byUser = new Map((entitlements ?? []).map((item) => [item.user_id, item]));
    const counts = emptyAdminCounts();
    for (const user of users) { counts.all += 1; counts[classifyAdminUser(byUser.get(user.id) ?? null)] += 1; }
    return json({ counts });
  } catch { return json({ error: "Unable to load admin dashboard." }, 500); }
});
