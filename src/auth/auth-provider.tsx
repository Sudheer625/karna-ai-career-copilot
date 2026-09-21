import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) void navigate({ to: "/login", replace: true });
  }, [isLoading, navigate, user]);
  if (isLoading || !user) return <div className="min-h-screen bg-paper" aria-busy="true" />;
  return <>{children}</>;
}

const protectedPaths = new Set([
  "/dashboard",
  "/profile",
  "/skills",
  "/resume",
  "/jobs",
  "/interview",
  "/roadmap",
  "/settings",
]);

export function AuthRouteGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const protectedRoute = protectedPaths.has(pathname);
  useEffect(() => {
    if (!isLoading && protectedRoute && !user) void navigate({ to: "/login", replace: true });
  }, [isLoading, navigate, protectedRoute, user]);
  if (isLoading && protectedRoute)
    return <div className="min-h-screen bg-paper" aria-busy="true" />;
  if (protectedRoute && !user) return null;
  return <>{children}</>;
}
