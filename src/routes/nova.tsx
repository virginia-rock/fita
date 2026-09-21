import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MEASURING_RULES, METRICS, METRIC_GROUPS } from "@/lib/measurements";
import { toISO, useAppData } from "@/lib/storage";

export const Route = createFileRoute("/nova")({
  head: () => ({
    meta: [
      { title: "Nova entrada · Fita." },
      {
        name: "description",
        content: "Registre circunferências, peso e composição corporal de uma nova medição.",
      },
      { property: "og:title", content: "Nova entrada · Fita." },
      {
        property: "og:description",
        content: "Formulário completo de medidas corporais com as regras de ouro para medir sozinho.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaEntrada,
});

function NovaEntrada() {
  const { data, saveEntry } = useAppData();
  const navigate = useNavigate();
  const [date, setDate] = useState(toISO(new Date()));
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const ultima = data.entries[data.entries.length - 1];

  function submit() {
    const parsed: Record<string, number> = {};
    for (const metric of METRICS) {
      const raw = values[metric.id]?.replace(",", ".").trim();
      if (raw) {
        const n = Number(raw);
        if (!Number.isNaN(n)) parsed[metric.id] = n;
      }
    }
    if (Object.keys(parsed).length === 0) {
      toast.error("Preencha ao menos um campo.");
      return;
    }
    saveEntry({ id: crypto.randomUUID(), date, values: parsed, ...(note ? { note } : {}) });
    toast.success("Medição registrada");
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <div className="rounded-sm bg-vellum/50 p-6 ring-1 ring-ink/5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <div className="label-caps text-ink/50">Nova entrada</div>
            <h1 className="mt-2 text-xl font-medium tracking-tight">Registrar medição</h1>
          </div>
          <label className="flex flex-col gap-1">
            <span className="label-caps text-ink/40">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="num rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-clay"
            />
          </label>
        </div>

        {METRIC_GROUPS.map((group) => (
          <div key={group} className="mt-6">
            <div className="label-caps mb-3 text-clay">{group}</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {METRICS.filter((m) => m.group === group).map((metric) => (
                <label key={metric.id} className="flex flex-col gap-1 bg-paper p-3 ring-1 ring-ink/5">
                  <span className="flex items-baseline justify-between">
                    <span className="text-[12px] font-semibold">{metric.label}</span>
                    <span className="num text-[10px] text-ink/40">
                      {metric.unit || "índice"}
                      {ultima?.values[metric.id] !== undefined &&
                        ` · anterior ${ultima.values[metric.id]}`}
                    </span>
                  </span>
                  <input
                    inputMode="decimal"
                    placeholder="0,0"
                    value={values[metric.id] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [metric.id]: e.target.value }))
                    }
                    className="num rounded-sm bg-vellum/60 px-3 py-2 text-base ring-1 ring-ink/10 focus:outline-none focus:ring-clay"
                  />
                  <span className="text-[10px] leading-snug text-ink/50">{metric.hint}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <label className="flex min-w-[260px] flex-1 flex-col gap-1">
            <span className="label-caps text-ink/40">Observações</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: medido em jejum, pela manhã"
              className="rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-clay"
            />
          </label>
          <button
            onClick={submit}
            className="rounded-sm bg-clay px-6 py-3 text-xs font-bold uppercase tracking-widest text-paper"
          >
            Salvar medição
          </button>
        </div>
      </div>

      <div className="rounded-sm bg-clay/5 p-6 ring-1 ring-clay/10">
        <div className="text-xs font-bold uppercase tracking-widest">Regras de ouro para medir sozinho</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MEASURING_RULES.map((rule) => (
            <div key={rule.title} className="border-l border-clay/30 pl-3">
              <div className="label-caps text-clay">{rule.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/70">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
