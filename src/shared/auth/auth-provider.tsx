"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Provider, Session, User } from "@supabase/supabase-js";
import { acceptDevFlowClientInvites, getCurrentDevFlowUser, type DevFlowAuthUser } from "@/shared/api/devflow-api";
import { supabase } from "./supabase-client";

type DevFlowOAuthProvider = Extract<Provider, "github" | "google">;

interface AuthContextValue {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  devFlowUser: DevFlowAuthUser | null;
  devFlowUserError: string | null;
  signIn: (email: string, password: string) => Promise<DevFlowAuthUser>;
  signInWithOAuth: (provider: DevFlowOAuthProvider, nextPath?: string | null) => Promise<void>;
  signUp: (email: string, password: string) => Promise<DevFlowAuthUser | null>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshDevFlowUser: () => Promise<DevFlowAuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [devFlowUser, setDevFlowUser] = useState<DevFlowAuthUser | null>(null);
  const [devFlowUserError, setDevFlowUserError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitialized(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshDevFlowUser = useCallback(async () => {
    if (!session) {
      setDevFlowUser(null);
      setDevFlowUserError(null);
      return null;
    }

    try {
      const user = await getCurrentDevFlowUser();
      setDevFlowUser(user);
      setDevFlowUserError(null);
      return user;
    } catch (error) {
      setDevFlowUser(null);
      setDevFlowUserError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let mounted = true;

    refreshDevFlowUser().catch(() => null);

    return () => {
      mounted = false;
    };
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = await getCurrentDevFlowUser();
    await acceptDevFlowClientInvites().catch(() => null);
    setDevFlowUser(user);
    setDevFlowUserError(null);
    return user;
  }, []);

  const signInWithOAuth = useCallback(async (provider: DevFlowOAuthProvider, nextPath?: string | null) => {
    const redirectPath = process.env.NEXT_PUBLIC_AUTH_REDIRECT_PATH || "/client/sign-in";
    const redirectUrl = new URL(redirectPath, window.location.origin);
    if (nextPath) redirectUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl.toString(),
        scopes: provider === "github" ? "read:user user:email" : undefined,
      },
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) return null;

    setSession(data.session);
    const user = await getCurrentDevFlowUser();
    await acceptDevFlowClientInvites().catch(() => null);
    setDevFlowUser(user);
    setDevFlowUserError(null);
    return user;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectTo = `${window.location.origin}/client/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setDevFlowUser(null);
    setDevFlowUserError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      devFlowUser,
      devFlowUserError,
      signIn,
      signInWithOAuth,
      signUp,
      resetPassword,
      updatePassword,
      refreshDevFlowUser,
      signOut,
    }),
    [devFlowUser, devFlowUserError, initialized, refreshDevFlowUser, resetPassword, session, signIn, signInWithOAuth, signOut, signUp, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
