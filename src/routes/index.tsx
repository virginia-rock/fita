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
      { title: "Fita. · Acompanhe sua evolução corporal" },
      {
        name: "description",
        content: "Registre suas medidas corporais com clareza, privacidade e uma rotina simples.",
      },
      { property: "og:title", content: "Fita. · Acompanhe sua evolução corporal" },
      {
        property: "og:description",
        content: "Um espaço simples para registrar suas medidas e acompanhar sua evolução.",
      },
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
        <Link to="/" className="flex items-center gap-3" aria-label="Fita. — página inicial">
          <div>
            <div className="flex items-end text-2xl font-semibold leading-none tracking-normal">
              <span>Fita</span>
              <span className="ml-1 size-2 shrink-0 -translate-y-px bg-clay" aria-hidden="true" />
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
            className="rounded-sm px-3 py-2 text-xs font-medium text-ink/65 transition-colors hover:text-ink"
          >
            {user ? "Minha conta" : "Entrar no app"}
          </button>
          <a
            href="https://github.com/carlospessin/fita"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir o projeto Fita no GitHub"
            title="Abrir no GitHub"
            className="inline-flex size-9 items-center justify-center rounded-sm bg-vellum text-ink/70 ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            <Github className="size-4" aria-hidden="true" />
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
            Acompanhe sua evolução corporal com clareza, privacidade e rotina.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65">
            Registre circunferências, peso e composição corporal. Veja o que mudou, crie uma rotina e
            mantenha seus dados sob seu controle.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAppEntry}
              className="rounded-sm bg-clay px-5 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              Criar conta grátis
            </button>
            <a
              href="#planos"
              className="rounded-sm px-5 py-3 text-xs font-medium uppercase tracking-widest text-ink/60 ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              Conhecer os planos
            </a>
          </div>
        </div>

        <div className="mt-16 max-w-2xl">
          <LocalStorageNotice>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <button type="button" onClick={handleAppEntry} className="font-medium text-clay underline-offset-4 hover:underline">
                Criar conta grátis
              </button>
              <span className="text-ink/45">Importe e exporte seus dados quando quiser.</span>
            </div>
          </LocalStorageNotice>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-[1200px] scroll-mt-8 px-6">
        <div className="mb-8 max-w-xl">
          <div className="label-caps text-clay">Se quiser ir além</div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight">Escolha como apoiar o Fita.</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Crie sua conta para começar no plano gratuito ou escolha uma opção Pro com armazenamento em nuvem.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <PlanCard
            name="Acesso mensal"
            price="R$ 29,90"
            cadence="pagamento único"
            description="Um mês de armazenamento em nuvem para manter seus registros disponíveis além deste navegador."
            features={["Um mês de acesso à nuvem", "Login e área da conta", "Cronologia"]}
            actionLabel="Adquirir um mês"
            onAction={() => handlePlan("cloud_month")}
          />
          <PlanCard
            name="Apoio recorrente"
            price="R$ 19,90"
            cadence="por mês"
            description="Apoie a continuidade do projeto e tenha seus dados acessíveis em qualquer lugar."
            features={["Armazenamento em nuvem", "Login e área da conta", "Cronologia", "Cancele quando quiser"]}
            actionLabel="Assinar"
            featured
            onAction={() => handlePlan("subscription")}
          />
        </div>
      </section>
    </main>
  );
}
