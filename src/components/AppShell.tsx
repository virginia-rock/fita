import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Github } from "lucide-react";
import { toast } from "sonner";
import { LocalStorageNotice } from "@/components/LocalStorageNotice";
import { exportData, parseImported, useAppData } from "@/lib/storage";
import { loadDemoSession } from "@/lib/demo-account";
import { isCloudEntitled } from "@/lib/entitlements";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth";

const NAV = [
  { to: "/app", label: "Painel Geral" },
  { to: "/nova", label: "Nova Entrada" },
  { to: "/cronologia", label: "Cronologia" },
] as const;

export function AppShell({
  children,
  showLocalStorageNotice = true,
}: {
  children: ReactNode;
  showLocalStorageNotice?: boolean;
}) {
  const { replaceAll, entitlement, entitlementError } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasDemoSession, setHasDemoSession] = useState(false);
  const { user: supabaseUser, loading: authLoading } = useSupabaseAuth();
  const cloudSyncEnabled = isCloudEntitled(entitlement);
  const visibleNav = NAV;

  useEffect(() => {
    if (!authLoading) {
      setHasDemoSession(Boolean(supabaseUser || (!isSupabaseConfigured && loadDemoSession())));
    }
  }, [authLoading, supabaseUser]);

  if (!authLoading && !hasDemoSession) {
    return (
      <main className="min-h-screen px-6 py-12 text-ink">
        <div className="mx-auto max-w-md rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Conta necessÃ¡ria</div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">Crie uma conta para continuar.</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            O Fita exige uma conta para acessar o painel e manter seu acesso identificado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/criar-conta" className="rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper">
              Criar conta
            </Link>
            <Link to="/entrar" className="rounded-sm bg-vellum px-4 py-3 text-xs font-medium uppercase tracking-widest text-ink/70 ring-1 ring-ink/10">
              Entrar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="min-h-screen pb-20 text-ink">
      <div className="paper-grain fixed inset-0 -z-10 opacity-20" />

      <header className="mx-auto flex max-w-[1200px] items-center justify-between border-b border-ink/5 px-6 py-8">
        <Link to="/" className="flex items-center gap-4" aria-label="Fita. â€” pÃ¡gina inicial">
          <div>
            <div className="flex items-end text-2xl font-semibold leading-none tracking-normal">
              <span>Fita</span>
              <span
                className="ml-1 size-2 shrink-0 -translate-y-px bg-clay"
                aria-hidden="true"
                style={{ marginBottom: 2 }}
              />
            </div>
            <div className="num text-[11px] uppercase tracking-wider text-ink/60">
              Registro corporal Â· {hoje}
            </div>
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to={hasDemoSession ? "/conta" : "/entrar"}
            className="rounded-sm px-2 py-2 text-xs font-medium text-ink/60 transition-colors hover:text-ink"
          >
            {hasDemoSession ? "Minha conta" : "Entrar"}
          </Link>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const data = parseImported(await file.text());
                replaceAll(data);
                toast.success(`${data.entries.length} registros restaurados`);
              } catch {
                toast.error("NÃ£o consegui ler esse arquivo.");
              }
              e.target.value = "";
            }}
          />
          <a
            href="https://gist.github.com/carlospessin/23e86da496433e13d9bb05ccade2a2bb"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir o projeto Fita no GitHub"
            title="Abrir no GitHub"
            className="inline-flex size-9 items-center justify-center rounded-sm bg-vellum text-ink/70 ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            <Github className="size-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-sm bg-vellum px-4 py-2 text-xs font-medium text-ink/80 ring-1 ring-ink/10 transition-colors hover:bg-white"
          >
            Importar
          </button>
          <button
            type="button"
            onClick={() => {
              exportData();
              toast.success("Arquivo de backup gerado");
            }}
            className="rounded-sm bg-clay px-4 py-2 text-xs font-medium text-paper shadow-sm ring-1 ring-clay transition-opacity hover:opacity-90"
          >
            Exportar
          </button>
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-[1200px] space-y-6 px-6">
        {entitlementError ? (
          <div className="rounded-sm bg-clay/10 px-4 py-3 text-sm text-clay" role="alert">
            Não foi possível verificar seu plano Pro. Seus dados não serão sincronizados até a conexão ser restabelecida.
          </div>
        ) : (
          showLocalStorageNotice && !cloudSyncEnabled && <LocalStorageNotice />
        )}
        <nav className="flex gap-6 border-b border-ink/5 pb-2 text-[11px] font-semibold uppercase tracking-widest">
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              className="pb-2 -mb-2 text-ink/40 transition-colors hover:text-ink/70"
              activeProps={{ className: "text-clay border-b border-clay" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
