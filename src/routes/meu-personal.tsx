import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StudentProfessionalTab } from "@/components/StudentProfessionalTab";
import {
  acceptProfessionalInvitation,
  professionalLinkErrorMessage,
  useStudentProfessionalLink,
} from "@/lib/professional-link-api";

export const Route = createFileRoute("/meu-personal")({
  head: () => ({ meta: [{ title: "Meu Personal · Fita." }] }),
  component: MeuPersonal,
});

function MeuPersonal() {
  const { link, loading } = useStudentProfessionalLink();
  const [token, setToken] = useState("");
  const [accepting, setAccepting] = useState(false);

  async function accept() {
    if (!token.trim()) return;
    setAccepting(true);
    try {
      await acceptProfessionalInvitation(token);
      toast.success("Convite aceito. Seu personal já pode acompanhar sua evolução.");
      window.location.reload();
    } catch (error) {
      toast.error(professionalLinkErrorMessage(error));
    } finally {
      setAccepting(false);
    }
  }

  return (
    <AppShell>
      {loading ? (
        <div className="rounded-sm bg-vellum/40 p-8 text-sm text-ink/55">Carregando vínculo…</div>
      ) : link ? (
        <StudentProfessionalTab link={link} />
      ) : (
        <div className="rounded-sm bg-vellum/40 p-8 text-sm text-ink/55">
          <p>Você não possui um vínculo profissional ativo.</p>
          <div className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Cole aqui o token do convite"
              className="min-w-0 flex-1 rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
            />
            <button
              type="button"
              onClick={accept}
              disabled={accepting || !token.trim()}
              className="rounded-sm bg-clay px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper disabled:opacity-50"
            >
              {accepting ? "Aceitando…" : "Aceitar convite"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
