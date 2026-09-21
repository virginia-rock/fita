import { useState, type FormEvent } from "react";
import { hasAuthErrors, validateLogin, validateSignup, type AuthErrors } from "@/lib/auth-validation";

type AuthFormProps = {
  mode: "login" | "signup";
  onSubmit: (data: { email: string; password: string }) => void | Promise<void>;
  submitting?: boolean;
  error?: string;
  confirmationMessage?: string;
};

const EMPTY_ERRORS: AuthErrors = { email: "", password: "", confirmPassword: "" };

export function AuthForm({ mode, onSubmit, submitting = false, error, confirmationMessage }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>(EMPTY_ERRORS);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = isSignup
      ? validateSignup(email, password, confirmPassword)
      : validateLogin(email, password);
    setErrors(nextErrors);
    if (hasAuthErrors(nextErrors)) return;
    await onSubmit({ email: email.trim().toLowerCase(), password });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {confirmationMessage && (
        <div className="rounded-sm bg-sage/10 px-4 py-3 text-sm text-ink/75" role="status">
          {confirmationMessage}
        </div>
      )}
      {error && (
        <div className="rounded-sm bg-clay/10 px-4 py-3 text-sm text-clay" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="label-caps mb-2 block text-ink/50">
          E-mail
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-sm bg-vellum px-3 py-3 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-clay"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "auth-email-error" : undefined}
        />
        {errors.email && <p id="auth-email-error" className="mt-1 text-xs text-clay">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="auth-password" className="label-caps mb-2 block text-ink/50">
          Senha
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm bg-vellum px-3 py-3 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-clay"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "auth-password-error" : undefined}
        />
        {errors.password && <p id="auth-password-error" className="mt-1 text-xs text-clay">{errors.password}</p>}
      </div>

      {isSignup && (
        <div>
          <label htmlFor="auth-confirm-password" className="label-caps mb-2 block text-ink/50">
            Repetir senha
          </label>
          <input
            id="auth-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-sm bg-vellum px-3 py-3 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-clay"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "auth-confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="auth-confirm-password-error" className="mt-1 text-xs text-clay">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? "Aguarde…" : isSignup ? "Criar conta" : "Entrar na conta"}
      </button>
    </form>
  );
}
