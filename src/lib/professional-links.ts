export type ProfessionalLinkStatus = "pending" | "active" | "ended" | "revoked";

export type ProfessionalLink = {
  id: string;
  professional_user_id: string;
  student_user_id: string;
  status: ProfessionalLinkStatus;
  can_student_edit: boolean;
};

const PROFESSIONAL_LIMITS: Record<string, number> = {
  professional_personal: 10,
  professional_personal_pro: 30,
  professional_studio: 100,
};

export function canProfessionalManageLink(link: ProfessionalLink, actorId: string) {
  return link.status === "active" && link.professional_user_id === actorId;
}

export function canStudentEdit(link: ProfessionalLink, actorId: string) {
  if (link.student_user_id !== actorId) return false;
  return link.status !== "active" || link.can_student_edit;
}

export function professionalLimitForPlan(plan: string) {
  return PROFESSIONAL_LIMITS[plan] ?? null;
}
