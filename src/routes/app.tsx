import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  METRICS,
  METRIC_GROUPS,
  formatDelta,
  formatValue,
  getMetric,
  type Metric,
} from "@/lib/measurements";
import {
  daysUntil,
  formatDateBR,
  nextScheduled,
  recurrenceLabel,
  useAppData,
  type Entry,
} from "@/lib/storage";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Painel Geral · Fita." },
      {
        name: "description",
        content:
          "Acompanhe suas medidas corporais, peso e composição com variação em relação ao registro anterior.",
      },
      { property: "og:title", content: "Painel Geral · Fita." },
      {
        property: "og:description",
        content: "Registro de medidas corporais com histórico e evolução no seu navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

function deltaOf(metric: Metric, last?: Entry, prev?: Entry) {
  const a = last?.values[metric.id];
  const b = prev?.values[metric.id];
  if (a === undefined || b === undefined) return undefined;
  return a - b;
}

function deltaClass(delta: number | undefined) {
  if (delta === undefined || delta === 0) return "text-ink/30";
  return delta > 0 ? "text-up" : "text-down";
}

function Arrow({ delta }: { delta: number | undefined }) {
  if (delta === undefined || delta === 0)
    return <span className="size-1 rounded-full bg-current" />;
  return delta > 0 ? (
    <span className="h-0 w-0 border-b-[5px] border-l-[3px] border-r-[3px] border-b-current border-l-transparent border-r-transparent" />
  ) : (
    <span className="h-0 w-0 border-l-[3px] border-r-[3px] border-t-[5px] border-l-transparent border-r-transparent border-t-current" />
  );
}

const GROUP_TAPE: Record<(typeof METRIC_GROUPS)[number], string> = {
  "Superiores e Tronco": "tape-rose",
  "Região Central": "tape-amber",
  "Membros Inferiores": "tape-mint",
  "Composição Corporal": "tape-sky",
};

function Painel() {
  const { data, hydrated } = useAppData();
  const entries = data.entries;
  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];

  const pesoMetric = getMetric("peso")!;
  const pesoDelta = deltaOf(pesoMetric, last, prev);
  const proxima = nextScheduled(data.recurrence);

  const abdomen = getMetric("abdomen")!;
  const serie = entries
    .filter((e) => e.values[abdomen.id] !== undefined)
    .map((e) => ({ date: formatDateBR(e.date).replace(/\sde\s/g, " "), valor: e.values[abdomen.id] }));

  if (!hydrated) {
    return (
      <AppShell>
        <div className="rounded-sm bg-vellum/50 p-12 text-center ring-1 ring-ink/5">
          <div className="label-caps text-ink/50">Carregando seus dados</div>
          <p className="mt-3 text-sm text-ink/60">Só um instante.</p>
        </div>
      </AppShell>
    );
  }

  if (entries.length === 0) {
    return (
      <AppShell>
        <div className="rounded-sm bg-vellum/50 p-12 text-center ring-1 ring-ink/5">
          <div className="label-caps text-ink/50">Nenhum registro ainda</div>
          <h1 className="mt-4 text-2xl font-medium tracking-tight">
            Comece pela sua primeira medição
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
            Registre suas circunferências e composição corporal. Tudo fica salvo no seu navegador e
            pode ser exportado para backup.
          </p>
          <Link
            to="/nova"
            className="mt-6 inline-block rounded-sm bg-clay px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-paper"
          >
            Nova entrada
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rounded-sm bg-vellum/50 p-6 ring-1 ring-ink/5">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-ink/10 pb-4">
          <div className="label-caps text-ink/50">
            Sumário de medição · {last ? formatDateBR(last.date) : "—"}
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <div className="label-caps text-ink/40">Massa total</div>
              <div className="num text-lg font-medium">
                {formatValue(last?.values[pesoMetric.id], pesoMetric)}{" "}
                <span className="text-xs">kg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label-caps text-ink/40">Variação</div>
              <div
                className={`num flex items-center justify-end gap-2 text-lg font-medium ${deltaClass(pesoDelta)}`}
              >
                <Arrow delta={pesoDelta} />
                {pesoDelta === undefined ? "—" : formatDelta(pesoDelta, pesoMetric)}
              </div>
            </div>
          </div>
        </div>

        {METRIC_GROUPS.map((group) => (
          <div key={group} className="mb-6 last:mb-0">
            <div className="label-caps mb-2 text-ink/40">{group}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {METRICS.filter((m) => m.group === group).map((metric) => {
                const value = last?.values[metric.id];
                const delta = deltaOf(metric, last, prev);
                return (
                  <Link
                    key={metric.id}
                    to="/medida/$id"
                    params={{ id: metric.id }}
                    className={`measurement-card ${GROUP_TAPE[group]} group min-h-32 rounded-md border py-5 pl-12 pr-4 transition-all duration-300`}
                  >
                    <div className="tape-scale num absolute inset-y-0 left-0 flex w-8 select-none flex-col items-center justify-between border-r py-3 text-[8px] font-medium opacity-70" aria-hidden="true">
                      <span>20</span><span>15</span><span>10</span><span>05</span>
                    </div>
                    <div className="label-caps mb-2 text-ink/55">{metric.label}</div>
                    <div className="num text-2xl font-medium tracking-normal">
                      {formatValue(value, metric)}
                      {metric.unit && <span className="ml-1 text-xs text-ink/40">{metric.unit}</span>}
                    </div>
                    <div
                      className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold italic ${deltaClass(delta)}`}
                    >
                      <Arrow delta={delta} />
                      {delta === undefined
                        ? "sem comparativo"
                        : `${formatDelta(delta, metric)} ${metric.unit}`.trim()}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-sm bg-vellum/30 p-6 ring-1 ring-ink/5 md:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest">
              Evolução · Perímetro abdominal
            </div>
            <Link to="/medida/$id" params={{ id: "abdomen" }} className="text-[10px] font-bold italic text-sage">
              ver detalhes
            </Link>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="oklch(0.31 0.017 55 / 8%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.31 0.017 55 / 45%)" }}
                  tickLine={false}
                  axisLine={{ stroke: "oklch(0.31 0.017 55 / 12%)" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "oklch(0.31 0.017 55 / 45%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 2,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v} cm`, "Abdômen"]}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--clay)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "var(--clay)" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-sm bg-clay/5 p-6 ring-1 ring-clay/10">
          <div className="mb-6 text-xs font-bold uppercase tracking-widest">Dados analíticos</div>
          <div className="flex-1 space-y-4">
            {["gordura_pct", "massa_muscular_pct", "gordura_visceral", "imc"].map((id) => {
              const metric = getMetric(id)!;
              const delta = deltaOf(metric, last, prev);
              return (
                <div
                  key={id}
                  className="flex items-baseline justify-between border-b border-clay/10 pb-1"
                >
                  <span className="text-[11px] uppercase text-ink/60">{metric.label}</span>
                  <span className={`num flex items-center gap-2 font-medium ${deltaClass(delta)}`}>
                    <Arrow delta={delta} />
                    <span className="text-ink">{formatValue(last?.values[id], metric)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-8 border-t border-clay/20 pt-6">
            <div className="label-caps mb-2 text-clay/70">Próxima revisão</div>
            <div className="text-sm font-medium">{recurrenceLabel(data.recurrence)}</div>
            {proxima && (
              <div className="label-caps mt-2 inline-flex items-center gap-2 rounded-sm bg-sage/10 px-2 py-1 text-up">
                <span className="size-1 rounded-full bg-current" />
                {daysUntil(proxima) === 0 ? "É hoje" : `Em ${daysUntil(proxima)} dias`}
              </div>
            )}
            <Link
              to="/cronologia"
              className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-clay"
            >
              Configurar recorrência
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
