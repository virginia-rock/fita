import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Github } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LocalStorageNotice } from "@/components/LocalStorageNotice";
import { exportData, parseImported, useAppData } from "@/lib/storage";
import { createPixPayload, PIX_KEY } from "@/lib/pix";
import { loadDemoSession } from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth";

const NAV = [
  { to: "/app", label: "Painel Geral" },
  { to: "/nova", label: "Nova Entrada" },
  { to: "/cronologia", label: "Cronologia" },
] as const;

const SUPPORT_AMOUNTS = [5, 10, 25, 50, 100] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AppShell({
  children,
  showLocalStorageNotice = true,
}: {
  children: ReactNode;
  showLocalStorageNotice?: boolean;
}) {
  const { replaceAll } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(10);
  const [customAmount, setCustomAmount] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasDemoSession, setHasDemoSession] = useState(false);
  const { user: supabaseUser, loading: authLoading } = useSupabaseAuth();
  const visibleNav = NAV;

  useEffect(() => {
    if (!authLoading) {
      setHasDemoSession(Boolean(supabaseUser || (!isSupabaseConfigured && loadDemoSession())));
    }
  }, [authLoading, supabaseUser]);

  const amount = useMemo(() => {
    if (selectedAmount !== "custom") return selectedAmount;
    const parsed = Number(customAmount.replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
  }, [customAmount, selectedAmount]);

  useEffect(() => {
    let cancelled = false;

    if (!supportOpen || amount === null) {
      setQrCode("");
      return;
    }

    QRCode.toDataURL(createPixPayload(amount), {
      width: 240,
      margin: 1,
      color: { dark: "#2d2926", light: "#f4efe6" },
    }).then((dataUrl) => {
      if (!cancelled) setQrCode(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [amount, supportOpen]);

  const copyPixKey = async () => {
    await navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success("Chave Pix copiada");
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!authLoading && !hasDemoSession) {
    return (
      <main className="min-h-screen px-6 py-12 text-ink">
        <div className="mx-auto max-w-md rounded-sm bg-vellum/40 p-6 ring-1 ring-ink/10 md:p-8">
          <div className="label-caps text-clay">Conta necessária</div>
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
        <Link to="/" className="flex items-center gap-4" aria-label="Fita. — página inicial">
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
              Registro corporal · {hoje}
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
                toast.error("Não consegui ler esse arquivo.");
              }
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="rounded-sm bg-vellum px-4 py-2 text-xs font-medium text-ink/80 ring-1 ring-ink/10 transition-colors hover:bg-white"
          >
            Apoie o projeto
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

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-ink sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle className="font-semibold">Apoie o projeto</DialogTitle>
            <DialogDescription className="text-ink/60">
              Escolha um valor e escaneie o QR Code com o app do seu banco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <div className="label-caps mb-2 text-ink/50">Escolha uma quantia</div>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORT_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedAmount(value)}
                    className={`rounded-sm px-3 py-2 text-sm ring-1 transition-colors ${
                      selectedAmount === value
                        ? "bg-clay text-paper ring-clay"
                        : "bg-vellum text-ink/80 ring-ink/10 hover:bg-white"
                    }`}
                  >
                    {formatCurrency(value)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAmount("custom")}
                  className={`rounded-sm px-3 py-2 text-sm ring-1 transition-colors ${
                    selectedAmount === "custom"
                      ? "bg-clay text-paper ring-clay"
                      : "bg-vellum text-ink/80 ring-ink/10 hover:bg-white"
                  }`}
                >
                  Outra quantia
                </button>
              </div>
            </div>

            {selectedAmount === "custom" && (
              <label className="block text-sm">
                <span className="label-caps mb-2 block text-ink/50">Valor personalizado</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/50">
                    R$
                  </span>
                  <Input
                    autoFocus
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    placeholder="0,00"
                    className="bg-vellum pl-10"
                  />
                </div>
                {customAmount !== "" && amount === null && (
                  <span className="mt-1 block text-xs text-clay">Informe um valor a partir de R$ 1,00.</span>
                )}
              </label>
            )}

            <div className="flex flex-col items-center gap-3 rounded-sm bg-vellum/60 p-4 text-center ring-1 ring-ink/5">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt={`QR Code Pix para doar ${formatCurrency(amount ?? 0)}`}
                  className="size-52 rounded-sm"
                />
              ) : (
                <div className="flex size-52 items-center justify-center bg-paper px-8 text-sm text-ink/50 ring-1 ring-ink/10">
                  Escolha um valor para gerar o QR Code.
                </div>
              )}
              <div className="text-sm font-medium">
                {amount === null ? "Defina o valor da contribuição" : `Contribuição de ${formatCurrency(amount)}`}
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-ink/55">
                Você também pode copiar a chave Pix e colá-la no aplicativo do seu banco.
              </p>
              <div className="flex w-full items-center gap-2 rounded-sm bg-paper px-3 py-2 text-left ring-1 ring-ink/10">
                <code className="min-w-0 flex-1 break-all text-[11px] text-ink/65">{PIX_KEY}</code>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="shrink-0 rounded-sm p-2 text-ink/60 transition-colors hover:bg-vellum hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                  aria-label="Copiar chave Pix"
                  title="Copiar chave Pix"
                >
                  {copied ? <Check className="size-4 text-clay" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto mt-8 max-w-[1200px] space-y-6 px-6">
        {showLocalStorageNotice && <LocalStorageNotice />}
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
