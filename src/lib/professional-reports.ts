import type { Entry } from "./storage";

type Workspace = { entries: Entry[] };

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}

export function canGenerateProfessionalReport(plan: string) {
  return plan === "professional_personal_pro" || plan === "professional_studio";
}

export function buildStudentReport(workspace: Workspace, previousWorkspace?: Workspace | null) {
  const currentEntries = [...workspace.entries].sort((a, b) => b.date.localeCompare(a.date));
  const previousEntries = [...(previousWorkspace?.entries ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const current = currentEntries[0] ?? { id: "", date: "", values: {} };
  const previous = previousEntries[0] ?? currentEntries[1] ?? { id: "", date: "", values: {} };
  const ids = new Set([...Object.keys(current.values), ...Object.keys(previous.values)]);
  const variations = Object.fromEntries(
    [...ids]
      .filter((id) => current.values[id] !== undefined && previous.values[id] !== undefined)
      .map((id) => [id, current.values[id] - previous.values[id]]),
  );
  return {
    current,
    previous,
    variations,
    photos: [],
    observations: current.note ?? "",
  };
}

export function renderStudentReportHtml(
  report: ReturnType<typeof buildStudentReport>,
  studentName: string,
) {
  const variationRows = Object.entries(report.variations)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${String(value)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Fita - ${escapeHtml(studentName)}</title>
<style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;color:#25231f}h1{font-weight:500}table{border-collapse:collapse;width:100%;margin-top:20px}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}small{color:#666}@media print{button{display:none}}</style>
</head><body><button onclick="window.print()">Imprimir / salvar PDF</button>
<h1>Relatório de evolução</h1><p><strong>Aluno:</strong> ${escapeHtml(studentName)}</p>
<p><small>Atual: ${escapeHtml(report.current.date || "sem registro")} · Anterior: ${escapeHtml(report.previous.date || "sem registro")}</small></p>
<h2>Variações</h2><table><thead><tr><th>Medida</th><th>Variação</th></tr></thead><tbody>${variationRows || '<tr><td colspan="2">Sem comparação disponível.</td></tr>'}</tbody></table>
<h2>Observações</h2><p>${escapeHtml(report.observations || "Nenhuma observação registrada.")}</p></body></html>`;
}
