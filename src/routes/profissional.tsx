import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  canAddProfessionalStudent,
  loadProfessionalStudents,
  professionalPlan,
  saveProfessionalStudents,
  type ProfessionalStudent,
} from "@/lib/professional";
import {
  addProfessionalEvaluation,
  createProfessionalInvitation,
  listProfessionalStudents,
  professionalLinkErrorMessage,
} from "@/lib/professional-link-api";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  buildStudentReport,
  canGenerateProfessionalReport,
  renderStudentReportHtml,
} from "@/lib/professional-reports";

export const Route = createFileRoute("/profissional")({
  head: () => ({
    meta: [
      { title: "Área profissional · Fita." },
      {
        name: "description",
        content: "Acompanhe a evolução dos seus alunos em um só lugar.",
      },
    ],
  }),
  component: ProfessionalArea,
});

function latestEvaluation(student: ProfessionalStudent) {
  return student.evaluations[student.evaluations.length - 1];
}

function formatDate(date: string | undefined) {
  if (!date) return "Sem avaliação";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function ProfessionalArea() {
  const [students, setStudents] = useState(loadProfessionalStudents);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const plan = professionalPlan("personal_pro");
  const activeStudents = students.filter((student) => student.status === "active");
  const visibleStudents = useMemo(
    () =>
      activeStudents.filter((student) => student.name.toLowerCase().includes(search.toLowerCase())),
    [activeStudents, search],
  );
  const selectedStudent = students.find((student) => student.id === selectedId) ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listProfessionalStudents()
      .then((rows) => {
        const remoteStudents = (Array.isArray(rows) ? rows : []).map((row) => {
          const item = row as {
            link_id: string;
            student_user_id: string;
            student_email: string;
            status: "pending" | "active";
          };
          return {
            id: item.student_user_id,
            linkId: item.link_id,
            name: item.student_email,
            email: item.student_email,
            status: item.status,
            evaluations: [],
          } satisfies ProfessionalStudent;
        });
        setStudents(remoteStudents);
      })
      .catch(() => toast.error("Não foi possível carregar os alunos vinculados."));
  }, []);

  const addStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!canAddProfessionalStudent(plan.id, activeStudents.length)) return;
    if (isSupabaseConfigured) {
      if (!newEmail.trim()) return;
      createProfessionalInvitation(newEmail)
        .then(({ invitation_token: token }) => {
          setInvitationToken(token);
          setNewName("");
          setNewEmail("");
          toast.success("Convite criado. Envie o token ao aluno.");
        })
        .catch((error) => toast.error(professionalLinkErrorMessage(error)));
      return;
    }
    if (!name) return;
    const next: ProfessionalStudent[] = [
      ...students,
      {
        id: crypto.randomUUID(),
        name,
        ...(newEmail.trim() ? { email: newEmail.trim() } : {}),
        status: "active",
        evaluations: [],
      },
    ];
    setStudents(next);
    saveProfessionalStudents(next);
    setNewName("");
    setNewEmail("");
    setShowForm(false);
  };

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink/50 hover:text-ink"
            >
              <ArrowLeft className="size-3" /> Voltar ao Fita
            </Link>
            <div className="label-caps mt-8 text-clay">Área profissional</div>
            <h1 className="mt-2 text-4xl font-medium tracking-tight">
              A evolução dos seus alunos, em um só lugar.
            </h1>
          </div>
          <div className="rounded-sm bg-vellum/60 px-4 py-3 text-right ring-1 ring-ink/10">
            <div className="label-caps text-ink/45">Plano demonstrativo</div>
            <div className="mt-1 text-sm font-medium">
              {plan.name} · {activeStudents.length} de {plan.studentLimit}
            </div>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-3">
          <SummaryCard
            label="Alunos ativos"
            value={`${activeStudents.length}`}
            detail={`limite de ${plan.studentLimit}`}
          />
          <SummaryCard
            label="Avaliações"
            value={`${students.reduce((total, student) => total + student.evaluations.length, 0)}`}
            detail="registros no painel"
          />
          <SummaryCard
            label="Última atualização"
            value={formatDate(
              activeStudents
                .flatMap((student) => student.evaluations)
                .sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
            )}
            detail="avaliação mais recente"
          />
        </section>

        {selectedStudent ? (
          <StudentDetail
            student={selectedStudent}
            plan={plan.id}
            onBack={() => setSelectedId(null)}
            onEvaluationSaved={(evaluation) =>
              setStudents((current) =>
                current.map((item) =>
                  item.id === selectedStudent.id
                    ? { ...item, evaluations: [...item.evaluations, evaluation] }
                    : item,
                ),
              )
            }
          />
        ) : (
          <section className="rounded-sm bg-vellum/35 p-5 ring-1 ring-ink/10 md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="label-caps text-ink/45">Carteira de alunos</div>
                <h2 className="mt-2 text-2xl font-medium">Acompanhamento</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm((open) => !open)}
                className="inline-flex items-center gap-2 rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper"
              >
                <Plus className="size-4" /> Adicionar aluno
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={addStudent}
                className="mt-6 grid gap-3 rounded-sm bg-paper p-4 ring-1 ring-ink/10 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  required={!isSupabaseConfigured}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nome do aluno"
                  className="rounded-sm bg-white px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required={isSupabaseConfigured}
                  placeholder={isSupabaseConfigured ? "E-mail do aluno" : "E-mail (opcional)"}
                  className="rounded-sm bg-white px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
                />
                <button
                  type="submit"
                  className="rounded-sm bg-sage px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper"
                >
                  Salvar
                </button>
              </form>
            )}

            {invitationToken && (
              <div className="mt-4 rounded-sm bg-sage/10 p-4 text-sm text-ink/70" role="status">
                <div className="label-caps text-up">Token do convite</div>
                <code className="mt-2 block break-all font-mono text-xs">{invitationToken}</code>
                <p className="mt-2 text-xs text-ink/55">
                  O aluno deve aceitar este convite logado com o mesmo e-mail informado.
                </p>
              </div>
            )}

            <div className="relative mt-6">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-ink/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar aluno"
                className="w-full rounded-sm bg-paper py-2.5 pl-10 pr-3 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
              />
            </div>

            <div className="mt-5 divide-y divide-ink/10">
              {visibleStudents.map((student) => {
                const evaluation = latestEvaluation(student);
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedId(student.id)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-paper/70"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-clay/10 text-clay">
                        <Users className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{student.name}</span>
                        <span className="block text-xs text-ink/45">
                          {student.email ?? "Convite ainda não enviado"}
                        </span>
                      </span>
                    </span>
                    <span className="hidden text-right text-xs text-ink/50 sm:block">
                      <span className="block">
                        {evaluation?.weight ? `${evaluation.weight} kg` : "Sem peso"}
                      </span>
                      <span className="block">{formatDate(evaluation?.date)}</span>
                    </span>
                  </button>
                );
              })}
              {visibleStudents.length === 0 && (
                <p className="py-8 text-center text-sm text-ink/50">Nenhum aluno encontrado.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-sm bg-vellum/35 p-5 ring-1 ring-ink/10">
      <div className="label-caps text-ink/45">{label}</div>
      <div className="num mt-3 text-2xl font-medium">{value}</div>
      <div className="mt-1 text-xs text-ink/50">{detail}</div>
    </div>
  );
}

function StudentDetail({
  student,
  plan,
  onBack,
  onEvaluationSaved,
}: {
  student: ProfessionalStudent;
  plan: string;
  onBack: () => void;
  onEvaluationSaved: (evaluation: NonNullable<ProfessionalStudent["evaluations"]>[number]) => void;
}) {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const evaluation = latestEvaluation(student);
  const reportAvailable = canGenerateProfessionalReport(plan);
  const saveEvaluation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const next = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      ...(weight ? { weight: Number(weight) } : {}),
      ...(waist ? { waist: Number(waist) } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    try {
      if (student.linkId) {
        await addProfessionalEvaluation(student.linkId, {
          id: next.id,
          date: next.date,
          values: {
            ...(next.weight !== undefined ? { peso: next.weight } : {}),
            ...(next.waist !== undefined ? { cintura: next.waist } : {}),
          },
          ...(next.notes ? { note: next.notes } : {}),
        });
      }
      onEvaluationSaved(next);
      setWeight("");
      setWaist("");
      setNotes("");
      toast.success("Avaliação registrada.");
    } catch (error) {
      toast.error(professionalLinkErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const downloadReport = () => {
    const report = buildStudentReport({
      entries: student.evaluations.map((item) => ({
        id: item.id,
        date: item.date,
        values: {
          ...(item.weight !== undefined ? { peso: item.weight } : {}),
          ...(item.waist !== undefined ? { cintura: item.waist } : {}),
          ...(item.bodyFat !== undefined ? { gordura_pct: item.bodyFat } : {}),
        },
        ...(item.notes ? { note: item.notes } : {}),
      })),
    });
    const blob = new Blob([renderStudentReportHtml(report, student.name)], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fita-relatorio-${student.name.toLowerCase().replaceAll(" ", "-")}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-sm bg-vellum/35 p-5 ring-1 ring-ink/10 md:p-7">
      <button
        type="button"
        onClick={onBack}
        className="text-xs uppercase tracking-widest text-clay"
      >
        ← Voltar para alunos
      </button>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-caps text-ink/45">Perfil do aluno</div>
          <h2 className="mt-2 text-3xl font-medium">{student.name}</h2>
        </div>
        <span className="rounded-sm bg-sage/10 px-3 py-2 text-xs uppercase tracking-widest text-up">
          Ativo
        </span>
      </div>
      {reportAvailable && (
        <button
          type="button"
          onClick={downloadReport}
          className="mt-5 rounded-sm bg-clay px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper"
        >
          Gerar relatório
        </button>
      )}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Metric label="Peso" value={evaluation?.weight ? `${evaluation.weight} kg` : "—"} />
        <Metric label="Cintura" value={evaluation?.waist ? `${evaluation.waist} cm` : "—"} />
        <Metric label="Gordura" value={evaluation?.bodyFat ? `${evaluation.bodyFat}%` : "—"} />
      </div>
      <form
        onSubmit={saveEvaluation}
        className="mt-8 grid gap-3 border-t border-ink/10 pt-5 md:grid-cols-4"
      >
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          placeholder="Peso (kg)"
          className="rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
        />
        <input
          type="number"
          step="0.1"
          value={waist}
          onChange={(event) => setWaist(event.target.value)}
          placeholder="Cintura (cm)"
          className="rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
        />
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observação"
          className="rounded-sm bg-paper px-3 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-clay"
        />
        <button
          type="submit"
          disabled={saving || (!weight && !waist && !notes.trim())}
          className="rounded-sm bg-sage px-4 py-2 text-xs font-medium uppercase tracking-widest text-paper disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Registrar avaliação"}
        </button>
      </form>
      <div className="mt-8 border-t border-ink/10 pt-5">
        <div className="label-caps text-ink/45">Histórico</div>
        <p className="mt-3 text-sm text-ink/60">
          {evaluation
            ? `Última avaliação em ${formatDate(evaluation.date)}.`
            : "Ainda não há avaliações registradas."}
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-paper p-4 ring-1 ring-ink/10">
      <div className="label-caps text-ink/45">{label}</div>
      <div className="num mt-2 text-xl font-medium">{value}</div>
    </div>
  );
}
