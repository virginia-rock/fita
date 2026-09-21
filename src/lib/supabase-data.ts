import type { AppData } from "@/lib/storage";
import { defaultRecurrence } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const TABLE = "fita_data";

function parseCloudData(value: unknown): AppData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<AppData>;
  if (!Array.isArray(data.entries)) return null;
  return {
    version: 1,
    entries: data.entries,
    recurrence: { ...defaultRecurrence, ...(data.recurrence ?? {}) },
  };
}

export async function loadCloudData(): Promise<AppData | null> {
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return parseCloudData(data?.data) ?? null;
}

export async function saveCloudData(appData: AppData) {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userData.user.id, data: appData }, { onConflict: "user_id" });
  if (error) throw error;
}
