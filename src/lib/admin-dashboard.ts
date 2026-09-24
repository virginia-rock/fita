import { supabase } from "./supabase";
import {
  parseAdminDashboard,
  parseAdminUsersPage,
  type AdminPlanFilter,
} from "./admin-dashboard-data";

export * from "./admin-dashboard-data";

async function invoke(name: string, body?: unknown) {
  if (!supabase) throw new Error("O Supabase não está configurado.");
  const { data, error } = await supabase.functions.invoke(
    name,
    body === undefined ? undefined : { body },
  );
  if (error) throw new Error("Não foi possível carregar o painel administrativo.");
  return data;
}

export async function loadAdminDashboard() {
  const parsed = parseAdminDashboard(await invoke("get-admin-dashboard"));
  if (!parsed) throw new Error("Resposta administrativa inválida.");
  return parsed;
}

export async function loadAdminUsers(plan: AdminPlanFilter, page: number) {
  const parsed = parseAdminUsersPage(await invoke("get-admin-users", { plan, page, limit: 50 }));
  if (!parsed) throw new Error("Resposta administrativa inválida.");
  return parsed;
}
