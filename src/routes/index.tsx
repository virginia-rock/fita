import { createFileRoute, Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { useState } from "react";
import { AccountModal } from "@/components/AccountModal";
import { LocalStorageNotice } from "@/components/LocalStorageNotice";
import { PlanCard } from "@/components/PlanCard";
import { hasDemoCloudAccess, loadDemoSession, type DemoPlan } from "@/lib/demo-account";
import { useSupabaseAuth } from "@/lib/supabase-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fita. · Acompanhe sua transformação corporal" },
      { name: "description", content: "Acompanhe sua transformação corporal além do peso." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [accountModalPlan, setAccountModalPlan] = useState<DemoPlan | null>(null);
  const { user, loading: authLoading } = useSupabaseAuth();
  const demoAccount = loadDemoSession();
  const hasProAccess = Boolean(
    user && demoAccount?.id === user.id && hasDemoCloudAccess(demoAccount),
  );
  const handleAppEntry = () => {
    if (!authLoading && user) {
      window.location.assign("/conta");
      return;
    }
    setAccountModalPlan("local");
  };
  const handlePlan = (plan: Exclude<DemoPlan, "local">) => {
    if (!authLoading && user) {
      window.location.assign(hasProAccess ? "/conta" : `/checkout?plan=${plan}`);
      return;
    }
    setAccountModalPlan(plan);
  };

  return (
    <main className="min-h-screen pb-20 text-ink">
      <div className="paper-grain fixed inset-0 -z-10 opacity-20" />
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Fita — página inicial">
          <div>
            <div className="flex items-end text-2xl font-semibold leading-none">
              <span>Fita</span>
              <span className="ml-1 size-2 shrink-0 -translate-y-px bg-clay" />
            </div>
            <div className="num mt-1 text-[10px] uppercase tracking-widest text-ink/50">
              Registro corporal
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAppEntry}
            className="rounded-sm px-3 py-2 text-xs font-medium text-ink/65 hover:text-ink"
          >
            {user ? "Minha conta" : "Entrar no app"}
          </button>
          <a
            href="https://gist.github.com/carlospessin/0b0552ef132cb9bdf51a95149658863c"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir o projeto Fita no GitHub"
            className="inline-flex size-9 items-center justify-center rounded-sm bg-vellum text-ink/70 ring-1 ring-ink/10 hover:bg-white hover:text-ink"
          >
            <Github className="size-4" />
          </a>
        </div>
      </header>
      {accountModalPlan && (
        <AccountModal
          open
          plan={accountModalPlan}
          onOpenChange={(open) => {
            if (!open) setAccountModalPlan(null);
          }}
        />
      )}
      <section className="mx-auto max-w-[1200px] px-6 pb-20 pt-12 md:pb-28 md:pt-24">
        <div className="max-w-3xl">
          <div className="label-caps text-clay">Uma fita métrica, uma balança</div>
          <h1 className="mt-5 max-w-2xl text-5xl font-medium leading-[0.98] tracking-[-0.04em] md:text-7xl">
            Acompanhe sua transformação além do peso.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65">
            Registre medidas, peso, composição corporal e evolução visual em um só lugar. Veja como
            seu corpo muda ao longo do tempo, mesmo quando a balança não conta toda a história.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAppEntry}
              className="rounded-sm bg-clay px-5 py-3 text-xs font-medium uppercase tracking-widest text-paper"
            >
              Começar grátis
            </button>
            <a
              href="#planos"
              className="rounded-sm px-5 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 ring-1 ring-ink/10 hover:bg-white hover:text-ink"
            >
              Ver planos
            </a>
          </div>
        </div>
        <div className="mt-16 max-w-2xl">
          <LocalStorageNotice>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <button
                type="button"
                onClick={handleAppEntry}
                className="font-medium text-clay underline-offset-4 hover:underline"
              >
                Começar grátis
              </button>
              <span className="text-ink/45">Importe e exporte seus dados quando quiser.</span>
            </div>
          </LocalStorageNotice>
        </div>
      </section>
      <section id="planos" className="mx-auto max-w-[1200px] scroll-mt-8 px-6">
        <div className="mb-8 max-w-xl">
          <div className="label-caps text-clay">Planos individuais</div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight">
            Escolha como acompanhar sua evolução.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            O gratuito mantém o essencial no seu navegador. O Pro adiciona nuvem, backup e uma visão
            mais completa da transformação.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <PlanCard
            name="Fita Free"
            price="R$ 0"
            cadence="para sempre"
            description="Para registrar sua evolução com privacidade e manter os dados neste navegador."
            features={["Medidas e peso", "Histórico básico", "Exportação dos dados"]}
            actionLabel="Começar grátis"
            onAction={handleAppEntry}
          />
          <PlanCard
            name="Fita Pro mensal"
            price="R$ 14,90"
            cadence="por mês"
            description="Sincronize seus registros e acompanhe sua transformação em qualquer dispositivo."
            features={[
              "Sincronização na nuvem",
              "Backup automático",
              "Cronologia e gráficos avançados",
            ]}
            actionLabel="Assinar Pro"
            onAction={() => handlePlan("subscription_monthly")}
            featured
          />
          <PlanCard
            name="Fita Pro anual"
            price="R$ 119,90"
            cadence="por ano · R$ 9,99/mês"
            description="A experiência completa do Pro com o melhor custo-benefício para acompanhar o ano todo."
            features={["Tudo do Pro mensal", "Comparação antes/depois", "Relatórios de evolução"]}
            actionLabel="Escolher anual"
            onAction={() => handlePlan("subscription_annual")}
          />
        </div>
      </section>
      <section id="profissionais" className="mx-auto mt-24 max-w-[1200px] scroll-mt-8 px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <div className="label-caps text-clay">Para profissionais</div>
            <h2 className="mt-3 text-3xl font-medium tracking-tight">
              Acompanhe a evolução dos seus alunos em um só lugar.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Medidas, peso, composição corporal, fotos, histórico e relatórios organizados para
              facilitar cada acompanhamento.
            </p>
          </div>
          <Link
            to="/profissional"
            className="rounded-sm px-4 py-3 text-xs font-medium uppercase tracking-widest text-clay ring-1 ring-clay/30 hover:bg-clay/5"
          >
            Sou profissional
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <ProfessionalPlanCard
            onAction={() => handlePlan("professional_personal")}
            name="Fita Personal"
            price="R$ 39,90"
            limit="Até 10 alunos"
            features={["Cadastro de alunos", "Medidas e histórico", "Gráficos individuais"]}
          />
          <ProfessionalPlanCard
            onAction={() => handlePlan("professional_personal_pro")}
            name="Fita Personal Pro"
            price="R$ 69,90"
            limit="Até 30 alunos"
            features={["Tudo do Personal", "Dashboard consolidado", "Relatórios e filtros"]}
            featured
          />
          <ProfessionalPlanCard
            onAction={() => handlePlan("professional_studio")}
            name="Fita Studio"
            price="R$ 149"
            limit="Até 100 alunos"
            features={["Tudo do Personal Pro", "Operação para studios", "Base pronta para equipes"]}
          />
        </div>
      </section>
    </main>
  );
}

function ProfessionalPlanCard({
  onAction,
  name,
  price,
  limit,
  features,
  featured = false,
}: {
  onAction: () => void;
  name: string;
  price: string;
  limit: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-sm p-6 ring-1 transition-transform hover:-translate-y-0.5 ${featured ? "bg-ink text-paper ring-ink" : "bg-vellum/50 text-ink ring-ink/10"}`}
    >
      <div className={`label-caps ${featured ? "text-paper/60" : "text-clay"}`}>{name}</div>
      <div className="num mt-4 text-3xl font-medium">
        {price}
        <span className={`ml-2 text-xs font-normal ${featured ? "text-paper/60" : "text-ink/50"}`}>
          /mês
        </span>
      </div>
      <div className={`mt-1 text-sm ${featured ? "text-paper/75" : "text-ink/60"}`}>{limit}</div>
      <ul className={`mt-6 flex-1 space-y-2 text-sm ${featured ? "text-paper/80" : "text-ink/65"}`}>
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAction}
        className={`mt-8 text-xs font-medium uppercase tracking-widest ${featured ? "text-paper" : "text-clay"}`}
      >
        Assinar agora
      </button>
    </article>
  );
}
