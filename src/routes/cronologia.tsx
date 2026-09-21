import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  daysUntil,
  formatDateBR,
  nextScheduled,
  recurrenceLabel,
  scheduledDatesInRange,
  toISO,
  useAppData,
  weekdayName,
  type Recurrence,
} from "@/lib/storage";
import { hasDemoCloudAccess, loadDemoSession } from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth";

export const Route = createFileRoute("/cronologia")({
  head: () => ({
    meta: [
      { title: "Cronologia · Fita." },
      {
        name: "description",
        content: "Calendário das medições e configuração da recorrência: diária, semanal, quinzenal ou mensal.",
      },
      { property: "og:title", content: "Cronologia · Fita." },
      {
        property: "og:description",
        content: "Defina quando medir e veja o calendário com os dias já registrados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cronologia,
});

const TIPOS: { id: Recurrence["type"]; label: string }[] = [
  { id: "diaria", label: "Diária" },
  { id: "semanal", label: "Semanal" },
  { id: "quinzenal", label: "Quinzenal" },
  { id: "mensal", label: "Mensal" },
];

function Cronologia() {
  const { data, setRecurrence, removeEntry } = useAppData();
  const { user, loading: authLoading } = useSupabaseAuth();
  const demoAccount = loadDemoSession();
  const cloudSyncEnabled = Boolean(
    (user && demoAccount?.id === user.id && hasDemoCloudAccess(demoAccount)) ||
      (!isSupabaseConfigured && hasDemoCloudAccess(demoAccount)),
  );
  const [ref, setRef] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  if (!authLoading && !cloudSyncEnabled) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl rounded-sm bg-vellum/50 p-8 ring-1 ring-ink/10">
          <div className="label-caps text-clay">Recurso Pro</div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">A cronologia está disponível nos planos Pro.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Faça um pagamento único ou assine para acessar a agenda de medições e sincronizar seu histórico na nuvem.
          </p>
          <Link to="/" hash="planos" className="mt-6 inline-block rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper">
            Conhecer os planos
          </Link>
        </div>
      </AppShell>
    );
  }

  const r = data.recurrence;
  const proxima = nextScheduled(r);

  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const agendadas = new Set(scheduledDatesInRange(r, first, last));
  const registradas = new Set(data.entries.map((e) => e.date));
  const hoje = toISO(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(ref.getFullYear(), ref.getMonth(), d));

  const update = (patch: Partial<Recurrence>) => {
    setRecurrence({ ...r, ...patch });
    toast.success("Recorrência atualizada");
  };

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-sm bg-vellum/50 p-6 ring-1 ring-ink/5 md:col-span-2">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="text-xs font-bold uppercase tracking-widest">
              {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}
                className="rounded-sm bg-paper px-3 py-1 text-xs ring-1 ring-ink/10"
              >
                ←
              </button>
              <button
                onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}
                className="rounded-sm bg-paper px-3 py-1 text-xs ring-1 ring-ink/10"
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-px bg-ink/5 ring-1 ring-ink/5">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="label-caps bg-vellum py-2 text-center text-ink/40">
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} className="bg-paper/40 py-4" />;
              const iso = toISO(d);
              const isAgendada = agendadas.has(iso);
              const isRegistrada = registradas.has(iso);
              return (
                <div
                  key={iso}
                  className={`num flex min-h-[64px] flex-col items-center justify-center gap-1 bg-paper py-2 text-sm ${
                    iso === hoje ? "ring-1 ring-inset ring-clay" : ""
                  }`}
                >
                  <span className={isAgendada ? "font-bold text-clay" : "text-ink/70"}>
                    {d.getDate()}
                  </span>
                  <span className="flex gap-1">
                    {isAgendada && <span className="size-1.5 rounded-full bg-clay" />}
                    {isRegistrada && <span className="size-1.5 rounded-full bg-up" />}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-6 text-[10px] uppercase tracking-wider text-ink/50">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-clay" /> dia agendado
            </span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-up" /> medição registrada
            </span>
          </div>
        </div>

        <div className="rounded-sm bg-clay/5 p-6 ring-1 ring-clay/10">
          <div className="text-xs font-bold uppercase tracking-widest">Recorrência</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ type: t.id })}
                className={`label-caps rounded-sm py-2 ring-1 transition-colors ${
                  r.type === t.id
                    ? "bg-clay text-paper ring-clay"
                    : "bg-paper text-ink/60 ring-ink/10 hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {r.type === "semanal" && (
            <label className="mt-4 flex flex-col gap-1">
              <span className="label-caps text-ink/40">Dia da semana</span>
              <select
                value={r.weekday}
                onChange={(e) => update({ weekday: Number(e.target.value) })}
                className="rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <option key={i} value={i}>
                    {weekdayName(i)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {r.type === "mensal" && (
            <label className="mt-4 flex flex-col gap-1">
              <span className="label-caps text-ink/40">Dia do mês</span>
              <input
                type="number"
                min={1}
                max={31}
                value={r.dayOfMonth}
                onChange={(e) => update({ dayOfMonth: Number(e.target.value) })}
                className="num rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10"
              />
            </label>
          )}

          {r.type === "quinzenal" && (
            <label className="mt-4 flex flex-col gap-1">
              <span className="label-caps text-ink/40">Contar a partir de</span>
              <input
                type="date"
                value={r.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                className="num rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10"
              />
            </label>
          )}

          <label className="mt-4 flex flex-col gap-1">
            <span className="label-caps text-ink/40">Horário</span>
            <input
              type="time"
              value={r.time}
              onChange={(e) => update({ time: e.target.value })}
              className="num rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10"
            />
          </label>

          <div className="mt-6 border-t border-clay/20 pt-4">
            <div className="label-caps text-clay/70">Agenda atual</div>
            <div className="mt-1 text-sm font-medium">{recurrenceLabel(r)}</div>
            {proxima && (
              <div className="num mt-2 text-[11px] text-ink/60">
                Próxima: {formatDateBR(proxima)} ·{" "}
                {daysUntil(proxima) === 0 ? "hoje" : `em ${daysUntil(proxima)} dias`}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-sm bg-vellum/30 p-6 ring-1 ring-ink/5">
        <div className="text-xs font-bold uppercase tracking-widest">Medições registradas</div>
        <div className="mt-4 divide-y divide-ink/5">
          {[...data.entries].reverse().map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3">
              <div>
                <div className="num text-sm font-medium">{formatDateBR(e.date)}</div>
                <div className="text-[11px] text-ink/50">
                  {Object.keys(e.values).length} campos preenchidos
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/nova"
                  search={{ edit: e.id }}
                  className="label-caps rounded-sm bg-paper px-3 py-1.5 text-clay ring-1 ring-ink/10"
                >
                  Editar
                </Link>
                <button
                  onClick={() => {
                    if (!window.confirm("Excluir este registro? Essa ação não pode ser desfeita.")) return;
                    removeEntry(e.id);
                    toast.success("Registro removido");
                  }}
                  className="label-caps rounded-sm bg-paper px-3 py-1.5 text-down ring-1 ring-ink/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {data.entries.length === 0 && (
            <p className="py-6 text-sm text-ink/50">Nenhuma medição registrada ainda.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
