import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export function useSupabaseAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    if (!supabase) {
      setState({ session: null, user: null, loading: false });
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted)
        setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signUpWithSupabase(email: string, password: string) {
  if (!supabase) return { user: null, session: null, error: null };
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/conta` : null;
  const options = emailRedirectTo ? { emailRedirectTo } : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    ...(options ? { options } : {}),
  });
  return { user: data.user, session: data.session, error };
}

export async function signInWithSupabase(email: string, password: string) {
  if (!supabase) return { user: null, session: null, error: null };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

export async function signOutFromSupabase() {
  if (!supabase) return null;
  const { error } = await supabase.auth.signOut();
  return error;
}
