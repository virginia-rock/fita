import type { ReactNode } from "react";

export function LocalStorageNotice({ children }: { children?: ReactNode }) {
  return (
    <aside className="rounded-sm border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-ink/70">
      <div className="label-caps mb-1 text-clay">Plano gratuito</div>
      <p>
        No plano gratuito, suas medições ficam salvas apenas neste navegador. Se você limpar os dados
        do navegador, elas também serão perdidas.
      </p>
      {children}
    </aside>
  );
}
