import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getStudentProfessionalWorkspace,
  leaveProfessionalLink,
} from "@/lib/professional-link-api";
import type { ProfessionalLink } from "@/lib/professional-links";
import { getMetric, type Metric } from "@/lib/measurements";
import type { Entry } from "@/lib/storage";

type Workspace = { data?: { entries?: Entry[] }; link_id?: string };

export function StudentProfessionalTab({ link }: { link: ProfessionalLink }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const entries = workspace?.data?.entries ?? [];
  const latest = entries[entries.length - 1];
  const metrics: [string, Metric][] = [
    ["Peso", getMetric("peso")!],
    ["Cintura", getMetric("cintura")!],
    ["Abdômen", getMetric("abdomen")!],
    ["Gordura", getMetric("gordura_pct")!],
  ];

  useEffect(() => {
    getStudentProfessionalWorkspace()
      .then((value) => setWorkspace(value as Workspace))
      .catch(() => toast.error("Não foi possível carregar sua área com o personal."))
      .finally(() => setLoading(false));
  }, []);

  async function leave() {
    try {
      await leaveProfessionalLink(link.id);
      toast.success("Vínculo encerrado. Seus dados continuam na sua conta.");
      window.location.assign("/app");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível encerrar o vínculo.");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-sm bg-clay/5 p-6 ring-1 ring-clay/15">
        <div className="label-caps text-clay">Meu Personal</div>
        <h1 className="mt-2 text-3xl font-medium">Acompanhamento profissional</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65">
          Seu personal registra as avaliações. Enquanto o vínculo estiver ativo, seus dados ficam
          protegidos contra edições acidentais e você pode acompanhar toda a evolução aqui.
        </p>
        <button
          type="button"
          onClick={leave}
          className="mt-5 rounded-sm bg-vellum px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink/70 ring-1 ring-ink/10"
        >
          Sair do personal
        </button>
      </div>
      {loading ? (
        <div className="rounded-sm bg-vellum/40 p-8 text-sm text-ink/55">
          Carregando suas avaliações…
        </div>
      ) : latest ? (
        <div className="rounded-sm bg-vellum/35 p-6 ring-1 ring-ink/10">
          <div className="label-caps text-ink/45">Última avaliação · {latest.date}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, metric]) => (
              <div key={metric.id} className="rounded-sm bg-paper p-4 ring-1 ring-ink/10">
                <div className="label-caps text-ink/45">{label}</div>
                <div className="num mt-2 text-xl font-medium">
                  {latest.values[metric.id] ?? "—"} {metric.unit}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-ink/10 pt-5 text-sm text-ink/60">
            {entries.length} avaliação(ões) registrada(s) pelo seu personal.
          </div>
        </div>
      ) : (
        <div className="rounded-sm bg-vellum/40 p-8 text-sm text-ink/55">
          Ainda não há avaliações registradas.
        </div>
      )}
    </section>
  );
}
