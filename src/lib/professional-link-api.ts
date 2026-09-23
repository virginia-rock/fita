export function normalizeInvitationEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Informe um e-mail válido para o convite.");
  }
  return normalized;
}

export function professionalLinkErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|not authorized|não autorizado/i.test(message)) {
    return "Você não tem permissão para alterar este vínculo.";
  }
  if (/limit|limite/i.test(message)) {
    return "O limite de alunos do seu plano foi atingido.";
  }
  if (/expired|expirado/i.test(message)) {
    return "Este convite expirou ou já foi utilizado.";
  }
  return "Não foi possível atualizar o vínculo profissional.";
}

async function callRpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { supabase } = await import("./supabase.ts");
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

export function createProfessionalInvitation(email: string) {
  return callRpc<{ invitation_token: string; expires_at: string }>(
    "create_professional_invitation",
    { target_email: normalizeInvitationEmail(email) },
  );
}

export function acceptProfessionalInvitation(token: string) {
  return callRpc("accept_professional_invitation", { invitation_token: token.trim() });
}

export function endProfessionalLink(linkId: string) {
  return callRpc("end_professional_link", { target_link_id: linkId });
}

export function leaveProfessionalLink(linkId: string) {
  return callRpc("leave_professional_link", { target_link_id: linkId });
}

export function listProfessionalStudents() {
  return callRpc("list_professional_students");
}

export function getProfessionalStudentWorkspace(linkId: string) {
  return callRpc("get_professional_student_workspace", { target_link_id: linkId });
}

export async function loadStudentProfessionalLink(): Promise<ProfessionalLink | null> {
  const { supabase } = await import("./supabase.ts");
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("fita_professional_links")
    .select("id, professional_user_id, student_user_id, status, can_student_edit")
    .eq("student_user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return (data as ProfessionalLink | null) ?? null;
}

export function useStudentProfessionalLink() {
  const [link, setLink] = useState<ProfessionalLink | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    loadStudentProfessionalLink()
      .then((next) => {
        if (!cancelled) setLink(next);
      })
      .catch(() => {
        if (!cancelled) setLink(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { link, loading };
}

export function getStudentProfessionalWorkspace() {
  return callRpc("get_student_professional_workspace");
}

export function addProfessionalEvaluation(linkId: string, entry: Record<string, unknown>) {
  return callRpc("add_professional_evaluation", {
    target_link_id: linkId,
    entry,
  });
}
import { useEffect, useState } from "react";
import type { ProfessionalLink } from "./professional-links";
