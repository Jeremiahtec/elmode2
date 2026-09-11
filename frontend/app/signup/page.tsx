// app/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { IconGauge } from "@/components/icons";

export default function SignupPage() {
  const { signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const result = await signUp(name, email, password);
    setBusy(false);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error);
    }
  };

  const handleGoogle = async () => {
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-900 p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
            <IconGauge className="h-5 w-5 text-accent" />
          </div>
          <div className="font-mono text-base font-bold tracking-widest2 text-white">ELMODE</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-graphite-500">Vehicle Diagnostic System</div>
        </div>

        <div className="rounded-lg border border-graphite-700 bg-graphite-850 p-6 shadow-panel">
          <h1 className="mb-5 text-[15px] font-semibold text-white">Create account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-graphite-500">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-accent/50"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-graphite-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-accent/50"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-graphite-500">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-accent/50"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-graphite-500">Confirm</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-accent/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-[12px] text-status-critical">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-accent py-2.5 text-[13px] font-semibold text-graphite-950 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-graphite-700" />
            <span className="text-[10px] uppercase tracking-wider text-graphite-600">Or</span>
            <div className="h-px flex-1 bg-graphite-700" />
          </div>

          <GoogleSignInButton onClick={handleGoogle} />
        </div>

        <p className="mt-5 text-center text-[13px] text-graphite-500">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
