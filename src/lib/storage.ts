import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseAuth } from "@/lib/supabase-auth";
import { loadCloudData, saveCloudData } from "@/lib/supabase-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  values: Record<string, number>;
  note?: string;
};

export type Recurrence = {
  type: "diaria" | "semanal" | "quinzenal" | "mensal";
  weekday: number; // 0-6 (domingo-sábado)
  dayOfMonth: number; // 1-31
  time: string; // HH:MM
  startDate: string; // YYYY-MM-DD
};

export type AppData = {
  version: 1;
  entries: Entry[];
  recurrence: Recurrence;
};

const STORAGE_KEY = "medida-viva:v1";

export const defaultRecurrence: Recurrence = {
  type: "semanal",
  weekday: 1,
  dayOfMonth: 1,
  time: "07:00",
  startDate: new Date().toISOString().slice(0, 10),
};

export const emptyData: AppData = {
  version: 1,
  entries: [],
  recurrence: defaultRecurrence,
};

function read(): AppData {
  if (typeof window === "undefined") return emptyData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      version: 1,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      recurrence: { ...defaultRecurrence, ...(parsed.recurrence ?? {}) },
    };
  } catch {
    return emptyData;
  }
}

function write(data: AppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("medida-viva:changed"));
}

function clearLocalCache() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("medida-viva:changed"));
}

function persistCloud(data: AppData) {
  void saveCloudData(data).catch((error) => {
    console.error("Não foi possível sincronizar os dados com o Supabase.", error);
  });
}

export function useAppData() {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  const { user, loading: authLoading } = useSupabaseAuth();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const localData = read();

    if (!user) {
      const hadPreviousUser = Boolean(previousUserId.current);
      if (hadPreviousUser) clearLocalCache();
      previousUserId.current = null;
      setData(hadPreviousUser || isSupabaseConfigured ? emptyData : localData);
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    previousUserId.current = user.id;
    setHydrated(false);
    loadCloudData()
      .then((cloudData) => {
        if (cancelled) return;
        const nextData = cloudData ?? localData;
        write(nextData);
        setData(nextData);
        setHydrated(true);
        if (!cloudData && (localData.entries.length > 0 || localData.recurrence !== defaultRecurrence)) {
          persistCloud(localData);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(localData);
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const sync = () => setData(read());
    window.addEventListener("medida-viva:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("medida-viva:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const saveEntry = useCallback((entry: Entry) => {
    const current = read();
    const others = current.entries.filter((e) => e.id !== entry.id && e.date !== entry.date);
    const entries = [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
    const nextData = { ...current, entries };
    write(nextData);
    if (user) persistCloud(nextData);
  }, [user]);

  const removeEntry = useCallback((id: string) => {
    const current = read();
    const nextData = { ...current, entries: current.entries.filter((e) => e.id !== id) };
    write(nextData);
    if (user) persistCloud(nextData);
  }, [user]);

  const setRecurrence = useCallback((recurrence: Recurrence) => {
    const nextData = { ...read(), recurrence };
    write(nextData);
    if (user) persistCloud(nextData);
  }, [user]);

  const replaceAll = useCallback((next: AppData) => {
    const nextData = {
      version: 1,
      entries: next.entries ?? [],
      recurrence: { ...defaultRecurrence, ...(next.recurrence ?? {}) },
    } satisfies AppData;
    write(nextData);
    if (user) persistCloud(nextData);
  }, [user]);

  return { data, hydrated, saveEntry, removeEntry, setRecurrence, replaceAll };
}

export function exportData() {
  const data = read();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fita-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImported(text: string): AppData {
  const parsed = JSON.parse(text) as AppData;
  if (!parsed || !Array.isArray(parsed.entries)) throw new Error("Arquivo inválido");
  return parsed;
}

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export const weekdayName = (i: number) => WEEKDAYS[i] ?? "";

export function recurrenceLabel(r: Recurrence) {
  switch (r.type) {
    case "diaria":
      return `Todos os dias · ${r.time}`;
    case "semanal":
      return `Toda ${weekdayName(r.weekday)} · ${r.time}`;
    case "quinzenal":
      return `A cada 15 dias · ${r.time}`;
    case "mensal":
      return `Todo dia ${r.dayOfMonth} · ${r.time}`;
  }
}

/** Datas agendadas dentro de um intervalo (inclusive). */
export function scheduledDatesInRange(r: Recurrence, from: Date, to: Date): string[] {
  const out: string[] = [];
  const start = new Date(`${r.startDate}T00:00:00`);
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    const iso = toISO(cursor);
    if (cursor >= new Date(start.getFullYear(), start.getMonth(), start.getDate())) {
      if (r.type === "diaria") out.push(iso);
      else if (r.type === "semanal" && cursor.getDay() === r.weekday) out.push(iso);
      else if (r.type === "quinzenal") {
        const diff = Math.round((cursor.getTime() - start.getTime()) / 86400000);
        if (diff >= 0 && diff % 15 === 0) out.push(iso);
      } else if (r.type === "mensal" && cursor.getDate() === r.dayOfMonth) out.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nextScheduled(r: Recurrence): string | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 400);
  return scheduledDatesInRange(r, today, horizon)[0];
}

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
