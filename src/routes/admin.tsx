import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  adminPlanFilters,
  loadAdminDashboard,
  loadAdminUsers,
  type AdminDashboard,
  type AdminPlanFilter,
  type AdminUsersPage,
} from "@/lib/admin-dashboard";
import { loadAdminAccess } from "@/lib/supabase-entitlements";

export const Route = createFileRoute("/admin")({ component: Admin });
const labels: Record<AdminPlanFilter, string> = {
  all: "Todos",
  free: "Free",
  cloud_month: "Mensal legado",
  subscription: "Assinatura legada",
  subscription_monthly: "Pro mensal",
  subscription_annual: "Pro anual",
  professional_personal: "Personal",
  professional_personal_pro: "Personal Pro",
  professional_studio: "Studio",
};
const date = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";
function Admin() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<AdminPlanFilter>("all");
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [page, setPage] = useState<AdminUsersPage | null>(null);
  const [number, setNumber] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    void loadAdminAccess()
      .then(setAllowed)
      .catch(() => setAllowed(false));
  }, []);
  useEffect(() => {
    if (!allowed) return;
    void loadAdminDashboard()
      .then(setDashboard)
      .catch(() => setError("Não foi possível carregar"));
  }, [allowed]);
  useEffect(() => {
    if (!allowed) return;
    void loadAdminUsers(selected, number)
      .then(setPage)
      .catch(() => setError("Não foi possível carregar"));
  }, [allowed, selected, number]);
  if (allowed === null)
    return (
      <AppShell>
        <p>Carregando painel administrativo.</p>
      </AppShell>
    );
  if (!allowed)
    return (
      <AppShell>
        <p>Acesso administrativo indisponível.</p>
        <Link to="/conta">Voltar à conta</Link>
      </AppShell>
    );
  return (
    <AppShell>
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <aside aria-label="Navegação administrativa" className="border-r border-ink/10">
          <button type="button" aria-current="page">
            Dashboard
          </button>
        </aside>
        <main>
          <div className="label-caps text-clay">Admin</div>
          <h1 className="mt-3 text-4xl font-medium">Dashboard</h1>
          {error && <p role="alert">{error}</p>}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard &&
              adminPlanFilters.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  aria-pressed={selected === plan}
                  onClick={() => {
                    setSelected(plan);
                    setNumber(0);
                  }}
                  className="rounded-sm bg-vellum p-4 text-left ring-1 ring-ink/10"
                >
                  <span>{labels[plan]}</span>
                  <strong className="block text-2xl">{dashboard.counts[plan]}</strong>
                </button>
              ))}
          </div>
          <div className="mt-8 overflow-x-auto">
            <table role="table" className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Email</th>
                  <th className="text-left">Plano</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Assinou em</th>
                  <th className="text-left">Expira/renova em</th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{labels[user.plan]}</td>
                    <td>{user.status}</td>
                    <td>{user.subscribedAt ? date(user.subscribedAt) : "Não registrado"}</td>
                    <td>{date(user.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3">
            <button disabled={number === 0} onClick={() => setNumber(number - 1)}>
              Anterior
            </button>
            <button
              disabled={!page || (number + 1) * 50 >= page.total}
              onClick={() => setNumber(number + 1)}
            >
              Próxima
            </button>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
