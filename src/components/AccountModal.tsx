import { useEffect, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import {
  createDemoAccount,
  loadDemoSession,
  setDemoSession,
  type DemoPlan,
} from "@/lib/demo-account";
import { isSupabaseConfigured } from "@/lib/supabase";
import { signInWithSupabase, signUpWithSupabase } from "@/lib/supabase-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AccountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: DemoPlan;
};

function destinationFor(plan: DemoPlan) {
  return plan === "local" ? "/app" : `/checkout?plan=${plan}`;
}

export function AccountModal({ open, onOpenChange, plan }: AccountModalProps) {
  const [createdEmail, setCreatedEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  useEffect(() => {
    if (!open) {
      setCreatedEmail("");
      setMode("signup");
      setLoginError("");
      setSignupError("");
      setSubmitting(false);
      setRequiresEmailConfirmation(false);
    }
  }, [open]);

  const isLocal = plan === "local";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-paper text-ink sm:max-w-md">
        <div
          className="flex items-end text-2xl font-semibold leading-none tracking-normal"
          aria-label="Fita."
        >
          <span>Fita</span>
          <span
            className="ml-1 size-2 shrink-0 -translate-y-px bg-clay"
            aria-hidden="true"
            style={{ marginBottom: 2 }}
          />
        </div>
        <DialogHeader className="pr-8">
          <DialogTitle className="font-semibold">
            {createdEmail
              ? "Conta criada."
              : mode === "login"
                ? "Entrar no Fita."
                : "Criar conta no Fita."}
          </DialogTitle>
          <DialogDescription className="text-ink/60">
            {createdEmail
              ? requiresEmailConfirmation
                ? `Enviamos um link de confirmação para ${createdEmail}.`
                : `Simulamos a confirmação para ${createdEmail}.`
              : mode === "login"
                ? "Entre na sua conta para continuar."
                : isLocal
                  ? "Crie uma conta para acessar o teste e manter seu acesso identificado."
                  : "Crie uma conta para continuar para o checkout de demonstração."}
          </DialogDescription>
        </DialogHeader>

        {createdEmail ? (
          <div className="space-y-4">
            <div
              className="rounded-sm bg-sage/10 px-4 py-3 text-sm leading-relaxed text-ink/70"
              role="status"
            >
              {requiresEmailConfirmation
                ? "Confirme seu e-mail e depois entre na conta para continuar."
                : "Nenhum e-mail real foi enviado. Esta é uma confirmação simulada."}
            </div>
            <button
              type="button"
              onClick={() =>
                window.location.assign(requiresEmailConfirmation ? "/entrar" : destinationFor(plan))
              }
              className="w-full rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              {requiresEmailConfirmation
                ? "Ir para o login"
                : isLocal
                  ? "Abrir o teste"
                  : "Continuar para o checkout"}
            </button>
          </div>
        ) : (
          <AuthForm
            key={`${plan}-${mode}`}
            mode={mode}
            {...(mode === "login" && loginError ? { error: loginError } : {})}
            {...(mode === "signup" && signupError ? { error: signupError } : {})}
            submitting={submitting}
            onSubmit={async ({ email, password }) => {
              setSubmitting(true);
              setLoginError("");
              setSignupError("");

              if (mode === "login") {
                if (isSupabaseConfigured) {
                  const { error } = await signInWithSupabase(email, password);
                  if (error) {
                    setLoginError(error.message);
                    setSubmitting(false);
                    return;
                  }
                } else {
                  const account = loadDemoSession();
                  if (!account || account.email !== email || account.demoPassword !== password) {
                    setLoginError(
                      "Não encontrei uma conta demo com esses dados. Crie uma conta primeiro.",
                    );
                    setSubmitting(false);
                    return;
                  }
                  setDemoSession({ ...account, emailConfirmed: true });
                }
                window.location.assign("/conta");
                return;
              }

              if (isSupabaseConfigured) {
                const { session, error } = await signUpWithSupabase(email, password);
                if (error) {
                  setSignupError(error.message);
                  setSubmitting(false);
                  return;
                }
                setCreatedEmail(email);
                setRequiresEmailConfirmation(!session);
                setSubmitting(false);
                return;
              }

              const account = createDemoAccount(email, undefined, password);
              setDemoSession(account);
              setCreatedEmail(account.email);
              setSubmitting(false);
            }}
          />
        )}

        {!createdEmail && (
          <p className="text-center text-sm text-ink/55">
            {mode === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setLoginError("");
              }}
              className="text-clay hover:underline"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
