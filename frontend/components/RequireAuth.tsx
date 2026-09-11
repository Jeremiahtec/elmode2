// components/RequireAuth.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-900">
        <div className="font-mono text-xs uppercase tracking-widest2 text-graphite-500">Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect is in-flight
  }

  return <>{children}</>;
}
