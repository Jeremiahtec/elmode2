// hooks/useAuth.ts
"use client";

/**
 * DEMO-GRADE AUTH — read this before assuming this is production security.
 *
 * The Java backend (see /pom.xml, application.properties) has Spring
 * Security intentionally commented out — it was cut from the defense build
 * to reduce failure surface (see prior conversation). That means there is
 * currently NO real backend endpoint to authenticate against: no
 * /api/auth/login, no session cookie issuance, no password hashing.
 *
 * Rather than fabricate a fake call to an endpoint that doesn't exist (which
 * would either silently fail or require me to invent backend behavior you
 * didn't ask me to build), this hook implements a real, working CLIENT-SIDE
 * session: credentials are "created" and checked against localStorage,
 * and a session token is generated and persisted client-side.
 *
 * This is sufficient to:
 *   - gate /dashboard, /telemetry, /diagnostics, /simulator behind login
 *   - drive the account menu, /account, sign-out flow
 *   - demonstrate the intended UX end-to-end for the defense
 *
 * It is NOT sufficient to:
 *   - protect real user data (there is none server-side to protect yet)
 *   - survive a backend restart in a meaningful way (there's nothing to restart)
 *   - be called "authentication" in a security sense — anyone with browser
 *     devtools can fabricate a session object and bypass this entirely
 *
 * THE INTENDED UPGRADE PATH (post-defense): replace signIn/signUp below
 * with real calls to a Spring Security + JWT backend (re-enable the
 * commented-out spring-boot-starter-security / -oauth2-resource-server
 * deps in pom.xml), and replace localStorage with an httpOnly cookie set
 * by the backend. The AuthUser/AuthSession shape in types/auth.ts is
 * designed to match what a real JWT-based backend would return, so that
 * swap should not require changing any component that calls useAuth().
 */

import { useCallback, useEffect, useState } from "react";
import type { AuthSession, AuthUser } from "@/types/auth";

const SESSION_KEY = "elmode.session.v1";
const USERS_KEY = "elmode.demo-users.v1"; // demo-only local "user table"

interface StoredCredential {
  email: string;
  password: string; // PLAINTEXT — demo-only, see file header. Never do this against a real backend.
  user: AuthUser;
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function readUsers(): StoredCredential[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredCredential[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function makeToken(): string {
  return `demo_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<{ ok: false; error: string }>; // see GoogleSignInButton — structured, not functional
  signOut: () => void;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setIsLoading(false);

    // Keep multiple tabs in sync — a real nicety, costs nothing here.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) setSession(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const users = readUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!match || match.password !== password) {
      return { ok: false as const, error: "Invalid email or password." };
    }
    const newSession: AuthSession = { user: match.user, token: makeToken(), issuedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return { ok: true as const };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false as const, error: "An account with this email already exists." };
    }
    const user: AuthUser = {
      id: makeToken(),
      name,
      email,
      provider: "password",
      createdAt: new Date().toISOString(),
    };
    writeUsers([...users, { email, password, user }]);
    const newSession: AuthSession = { user, token: makeToken(), issuedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return { ok: true as const };
  }, []);

  // Deliberately non-functional — see GoogleSignInButton.tsx for the full
  // explanation of what's structured vs. what requires real Google Cloud
  // credentials from you. Returns an error rather than pretending to work.
  const signInWithGoogle = useCallback(async () => {
    return { ok: false as const, error: "Google OAuth is not configured. See NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local." };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return {
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
