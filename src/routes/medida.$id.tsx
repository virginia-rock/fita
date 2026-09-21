import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
import { formatDelta, formatValue, getMetric } from "@/lib/measurements";
import { formatDateBR, useAppData } from "@/lib/storage";

export const Route = createFileRoute("/medida/$id")({
  loader: ({ params }) => {
    const metric = getMetric(params.id);
    if (!metric) throw notFound();
    return { metric };
  },
  head: ({ loaderData }) => {
    const nome = loaderData?.metric.label ?? "Medida";
    return {
      meta: [
        { title: `${nome} · Fita.` },
        { name: "description", content: `Evolução completa da medida ${nome} ao longo do tempo.` },
        { property: "og:title", content: `${nome} · Fita.` },
        {
          property: "og:description",
          content: `Gráfico de evolução e histórico de registros de ${nome}.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: DetalheMedida,
});

function DetalheMedida() {
  const { metric } = Route.useLoaderData();
  const { data } = useAppData();

  const registros = data.entries
    .filter((e) => e.values[metric.id] !== undefined)
    .map((e) => ({ date: e.date, valor: e.values[metric.id] as number }));

  const serie = registros.map((r) => ({
    label: formatDateBR(r.date).replace(/\.| de /g, " ").trim(),
    valor: r.valor,
  }));

  const atual = registros[registros.length - 1];
  const anterior = registros[registros.length - 2];
  const primeiro = registros[0];
  const delta = atual && anterior ? atual.valor - anterior.valor : undefined;
  const total = atual && primeiro ? atual.valor - primeiro.valor : undefined;
  const valores = registros.map((r) => r.valor);

  const cor = delta === undefined || delta === 0 ? "var(--sage)" : delta > 0 ? "var(--up)" : "var(--down)";
  const deltaClass = delta === undefined || delta === 0 ? "text-ink/30" : delta > 0 ? "text-up" : "text-down";

  return (
    <AppShell>
      <div className="rounded-sm bg-vellum/50 p-6 ring-1 ring-ink/5">
        <Link to="/" className="label-caps text-ink/40 hover:text-clay">
          ← Painel geral
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6 border-b border-ink/10 pb-4">
          <div>
            <div className="label-caps text-clay">{metric.group}</div>
            <h1 className="mt-2 text-2xl font-medium tracking-tight">{metric.label}</h1>
            <p className="mt-1 max-w-md text-[12px] text-ink/60">{metric.hint}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <div className="label-caps text-ink/40">Atual</div>
              <div className="num text-2xl font-medium">
                {formatValue(atual?.valor, metric)}
                {metric.unit && <span className="ml-1 text-xs text-ink/40">{metric.unit}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="label-caps text-ink/40">vs anterior</div>
              <div className={`num text-2xl font-medium ${deltaClass}`}>
                {delta === undefined ? "—" : formatDelta(delta, metric)}
              </div>
            </div>
            <div className="text-right">
              <div className="label-caps text-ink/40">Desde o início</div>
              <div className="num text-2xl font-medium text-ink/70">
                {total === undefined ? "—" : formatDelta(total, metric)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 h-[320px] w-full">
          {serie.length < 2 ? (
            <div className="grid h-full place-items-center text-sm text-ink/50">
              Registre pelo menos duas medições para ver a evolução.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="oklch(0.31 0.017 55 / 8%)" vertical={false} />
                <XAxis
                  dataKey="label"
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
                  formatter={(v) => [`${v} ${metric.unit}`.trim(), metric.label]}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={cor}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: cor }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-sm bg-vellum/30 p-6 ring-1 ring-ink/5 md:col-span-2">
          <div className="text-xs font-bold uppercase tracking-widest">Histórico de registros</div>
          <div className="mt-4 divide-y divide-ink/5">
            {[...registros].reverse().map((r, i, arr) => {
              const ant = arr[i + 1];
              const d = ant ? r.valor - ant.valor : undefined;
              const cls = d === undefined || d === 0 ? "text-ink/30" : d > 0 ? "text-up" : "text-down";
              return (
                <div key={r.date} className="flex items-baseline justify-between py-2">
                  <span className="num text-[12px] text-ink/60">{formatDateBR(r.date)}</span>
                  <span className="flex items-baseline gap-4">
                    <span className="num text-sm font-medium">
                      {formatValue(r.valor, metric)} {metric.unit}
                    </span>
                    <span className={`num w-16 text-right text-[11px] font-bold ${cls}`}>
                      {d === undefined ? "—" : formatDelta(d, metric)}
                    </span>
                  </span>
                </div>
              );
            })}
            {registros.length === 0 && (
              <p className="py-6 text-sm text-ink/50">Nenhum registro para esta medida ainda.</p>
            )}
          </div>
        </div>

        <div className="rounded-sm bg-clay/5 p-6 ring-1 ring-clay/10">
          <div className="text-xs font-bold uppercase tracking-widest">Resumo</div>
          <div className="mt-4 space-y-3">
            <Resumo label="Registros" value={String(registros.length)} />
            <Resumo
              label="Menor"
              value={valores.length ? formatValue(Math.min(...valores), metric) : "—"}
            />
            <Resumo
              label="Maior"
              value={valores.length ? formatValue(Math.max(...valores), metric) : "—"}
            />
            <Resumo
              label="Média"
              value={
                valores.length
                  ? formatValue(valores.reduce((a, b) => a + b, 0) / valores.length, metric)
                  : "—"
              }
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-clay/10 pb-1">
      <span className="text-[11px] uppercase text-ink/60">{label}</span>
      <span className="num font-medium">{value}</span>
    </div>
  );
}
