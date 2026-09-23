export type ProfessionalPlanId = "personal" | "personal_pro" | "studio";

export type ProfessionalPlan = {
  id: ProfessionalPlanId;
  name: string;
  price: string;
  cadence: string;
  studentLimit: number;
  audience: string;
  features: string[];
};

export const PROFESSIONAL_PLANS: ProfessionalPlan[] = [
  {
    id: "personal",
    name: "Fita Personal",
    price: "R$ 39,90",
    cadence: "por mês",
    studentLimit: 10,
    audience: "Para profissionais com uma carteira enxuta de alunos.",
    features: ["Até 10 alunos", "Medidas e avaliações", "Histórico e gráficos"],
  },
  {
    id: "personal_pro",
    name: "Fita Personal Pro",
    price: "R$ 69,90",
    cadence: "por mês",
    studentLimit: 30,
    audience: "Para quem acompanha uma carteira maior com mais contexto.",
    features: ["Até 30 alunos", "Dashboard consolidado", "Relatórios e filtros"],
  },
  {
    id: "studio",
    name: "Fita Studio",
    price: "R$ 149",
    cadence: "por mês",
    studentLimit: 100,
    audience: "Para studios, clínicas e operações de acompanhamento corporal.",
    features: ["Até 100 alunos", "Tudo do Personal Pro", "Base pronta para equipes"],
  },
];

export type ProfessionalEvaluation = {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
  bodyFat?: number;
  notes?: string;
};

export type ProfessionalStudent = {
  id: string;
  linkId?: string;
  name: string;
  email?: string;
  status: "active" | "archived" | "pending";
  evaluations: ProfessionalEvaluation[];
};

export const PROFESSIONAL_WORKSPACE_KEY = "fita.professional-workspace";

export const DEMO_PROFESSIONAL_STUDENTS: ProfessionalStudent[] = [
  {
    id: "student-ana",
    name: "Ana Martins",
    status: "active",
    evaluations: [{ id: "evaluation-ana", date: "2026-09-18", weight: 68.4, waist: 78 }],
  },
  {
    id: "student-rafael",
    name: "Rafael Costa",
    status: "active",
    evaluations: [{ id: "evaluation-rafael", date: "2026-09-15", weight: 82.1, waist: 91 }],
  },
];

export function parseProfessionalPlan(value: unknown): ProfessionalPlanId | null {
  return value === "personal" || value === "personal_pro" || value === "studio" ? value : null;
}

export function professionalPlan(id: ProfessionalPlanId) {
  return PROFESSIONAL_PLANS.find((plan) => plan.id === id)!;
}

export function canAddProfessionalStudent(plan: ProfessionalPlanId, studentCount: number) {
  return studentCount < professionalPlan(plan).studentLimit;
}

export function loadProfessionalStudents(): ProfessionalStudent[] {
  if (typeof window === "undefined") return DEMO_PROFESSIONAL_STUDENTS;
  const raw = window.localStorage.getItem(PROFESSIONAL_WORKSPACE_KEY);
  if (!raw) return DEMO_PROFESSIONAL_STUDENTS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEMO_PROFESSIONAL_STUDENTS;
    return parsed as ProfessionalStudent[];
  } catch {
    return DEMO_PROFESSIONAL_STUDENTS;
  }
}

export function saveProfessionalStudents(students: ProfessionalStudent[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFESSIONAL_WORKSPACE_KEY, JSON.stringify(students));
  }
}
