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
import type { Session, User } from "@supabase/supabase-js";
import {
  getCurrentDevFlowUser,
  NOT_A_TEAM_MEMBER,
  DevFlowApiError,
  type DevFlowAuthUser,
} from "@/shared/api/devflow-api";
import { supabase } from "./supabase-client";

/**
 * Auth for the internal console: GitHub only.
 *
 * Access is decided entirely by membership of a team in the GitHub organisation, so there is
 * no email/password or sign-up path here — a password account could never be resolved to a
 * DEV or PM role. Client accounts belong to the separate Alphaexplora client app, which
 * shares this Supabase project but owns its own sign-up and invite handling.
 */
interface AuthContextValue {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  devFlowUser: DevFlowAuthUser | null;
  devFlowUserError: string | null;
  /** True when the GitHub account signed in fine but is in none of the mapped org teams. */
  notATeamMember: boolean;
  /** The API's explanation for that refusal, shown on the no-access screen. */
  notATeamMemberMessage: string | null;
  signInWithGithub: (nextPath?: string | null) => Promise<void>;
  refreshDevFlowUser: () => Promise<DevFlowAuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [devFlowUser, setDevFlowUser] = useState<DevFlowAuthUser | null>(null);
  const [devFlowUserError, setDevFlowUserError] = useState<string | null>(null);
  const [notATeamMember, setNotATeamMember] = useState(false);
  const [notATeamMemberMessage, setNotATeamMemberMessage] = useState<string | null>(null);

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
      setNotATeamMember(false);
      setNotATeamMemberMessage(null);
      return null;
    }

    try {
      const user = await getCurrentDevFlowUser();
      setDevFlowUser(user);
      setDevFlowUserError(null);
      setNotATeamMember(false);
      setNotATeamMemberMessage(null);
      return user;
    } catch (error) {
      setDevFlowUser(null);
      // "Not on a team" is an expected outcome for a valid GitHub login, not a fault to
      // report as a broken session — flag it so the app can show the staff-only screen.
      const refused = error instanceof DevFlowApiError && error.code === NOT_A_TEAM_MEMBER;
      const detail = error instanceof Error ? error.message : String(error);
      setNotATeamMember(refused);
      setNotATeamMemberMessage(refused ? detail : null);
      setDevFlowUserError(refused ? null : detail);
      throw error;
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refreshDevFlowUser().catch(() => null);
  }, [session]);

  const signInWithGithub = useCallback(async (nextPath?: string | null) => {
    // GitHub redirects back to /auth/callback, which exchanges the code for a session
    // server-side and redirects to /sign-in with the session already in cookies.
    const redirectUrl = new URL("/auth/callback", window.location.origin);
    if (nextPath) redirectUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectUrl.toString(),
        // read:user + user:email are what the backend needs to read the login and email;
        // team membership itself is read server-side with the GitHub App installation.
        scopes: "read:user user:email",
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setDevFlowUser(null);
    setDevFlowUserError(null);
    setNotATeamMember(false);
    setNotATeamMemberMessage(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      devFlowUser,
      devFlowUserError,
      notATeamMember,
      notATeamMemberMessage,
      signInWithGithub,
      refreshDevFlowUser,
      signOut,
    }),
    [
      devFlowUser,
      devFlowUserError,
      notATeamMember,
      notATeamMemberMessage,
      initialized,
      refreshDevFlowUser,
      session,
      signInWithGithub,
      signOut,
    ],
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
