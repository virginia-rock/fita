import { useState } from "react";
import type { InsiderAccess } from "@/lib/insider";
import { insiderOfferCopy } from "@/lib/insider-presentation";

type InsiderOfferCardProps = {
  access: InsiderAccess;
  onStart: () => Promise<void>;
};

export function InsiderOfferCard({ access, onStart }: InsiderOfferCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onStart();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar sua inscrição.");
      setBusy(false);
    }
  };

  return (
    <section className="rounded-sm bg-sage/10 p-5 ring-1 ring-sage/30">
      <div className="label-caps text-sage">Programa Insider</div>
      <h2 className="mt-2 text-xl font-medium">Você foi selecionado para participar.</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">
        Seu período de teste começa após concluir a inscrição. Depois de 90 dias, você terá 30% de
        desconto vitalício na mensalidade. Ao cancelar, o benefício Insider será encerrado.
      </p>
      <p className="mt-3 text-sm font-medium text-ink">Oferta: {insiderOfferCopy(access.offer)}</p>
      {error && (
        <p className="mt-3 text-sm text-clay" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="mt-5 rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Abrindo checkout…" : "Participar do programa Insider"}
      </button>
    </section>
  );
}
