"use client";

import type { Session, User } from "@supabase/supabase-js";

// Mock user store / session store inside localStorage
const SESSION_KEY = "devflow_eve_mock_session";
const listeners = new Set<(event: string, session: Session | null) => void>();

function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
  
  listeners.forEach((listener) => listener("SIGNED_IN", session));
}

function generateMockJwt(user: User): string {
  // Generate a dummy JWT payload and base64 encode the header and payload
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata || { provider: "github", providers: ["github"] },
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
  };
  
  const encode = (obj: any) => {
    // Browser compatible base64 encoding (btoa/unescape)
    const jsonStr = JSON.stringify(obj);
    if (typeof window !== "undefined") {
      return btoa(unescape(encodeURIComponent(jsonStr))).replace(/=/g, "");
    }
    return Buffer.from(jsonStr).toString("base64").replace(/=/g, "");
  };
  return `${encode(header)}.${encode(payload)}.dummysignature`;
}

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },
    
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      listeners.add(callback);
      const session = getStoredSession();
      // Execute once initially
      setTimeout(() => callback("INITIAL_SESSION", session), 0);
      
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            }
          }
        }
      };
    },
    
    async signInWithPassword({ email, password }: any): Promise<{ data: { session: Session; user: User }; error: null }> {
      // Local mock login: accept any credentials, generate a deterministic user ID
      const userId = "mock-user-" + email.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const user: User = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
        app_metadata: { provider: "github", providers: ["github"] },
        user_metadata: { full_name: email.split("@")[0] },
        aud: "authenticated",
        role: "authenticated"
      };
      
      const session: Session = {
        access_token: generateMockJwt(user),
        token_type: "bearer",
        expires_in: 3600 * 24 * 7,
        refresh_token: "dummy_refresh_token",
        user
      };
      
      setStoredSession(session);
      return { data: { session, user }, error: null };
    },
    
    async signInWithOAuth({ provider, options }: any): Promise<{ data: { provider: any; url: string }; error: null }> {
      // Direct redirect back or mock complete login
      const email = "developer@devflow-eve.local";
      const userId = "mock-user-developer";
      const user: User = {
        id: userId,
        email,
        created_at: new Date().toISOString(),
        app_metadata: { provider: "github", providers: ["github"] },
        user_metadata: { full_name: "Mock Developer" },
        aud: "authenticated",
        role: "authenticated"
      };
      
      const session: Session = {
        access_token: generateMockJwt(user),
        token_type: "bearer",
        expires_in: 3600 * 24 * 7,
        refresh_token: "dummy_refresh_token",
        user
      };
      
      setStoredSession(session);
      
      if (typeof window !== "undefined") {
        const url = new URL(options?.redirectTo || window.location.origin);
        window.location.href = url.toString();
      }
      return { data: { provider, url: "" }, error: null };
    },
    
    async signUp({ email, password }: any): Promise<{ data: { session: Session; user: User }; error: null }> {
      return this.signInWithPassword({ email, password });
    },
    
    async signOut(): Promise<{ error: null }> {
      setStoredSession(null);
      return { error: null };
    },
    
    async resetPasswordForEmail(email: string, options: any): Promise<{ error: null }> {
      return { error: null };
    },
    
    async updateUser({ password }: any): Promise<{ error: null }> {
      return { error: null };
    }
  }
};

