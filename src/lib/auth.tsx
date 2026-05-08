import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = { session: Session | null; user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!session?.user) {
      document.documentElement.classList.remove("dark");
      return;
    }

    supabase
      .from("profiles")
      .select("dark_mode")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        document.documentElement.classList.toggle("dark", Boolean(data?.dark_mode));
      });
  }, [session?.user]);

  return (
    <AuthCtx.Provider value={{ session, user: session?.user ?? null, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
