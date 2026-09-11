// app/account/page.tsx
"use client";

import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { useElmodeStream } from "@/hooks/useElmodeStream";
import { ConnectionBanner } from "@/components/ConnectionBanner";

function AccountContent() {
  const { user } = useAuth();
  const { connectionStatus } = useElmodeStream();

  return (
    <AppShell connectionStatus={connectionStatus}>
      <ConnectionBanner status={connectionStatus} isStale={false} />

      <div className="border-b border-graphite-700 px-8 py-5">
        <div className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">Account</div>
        <div className="text-lg font-semibold text-white">Profile</div>
      </div>

      <div className="max-w-lg p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 font-mono text-2xl font-bold text-accent">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="text-base font-semibold text-white">{user?.name}</div>
            <div className="text-[13px] text-graphite-500">{user?.email}</div>
          </div>
        </div>

        <dl className="space-y-3 border-t border-graphite-800 pt-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-graphite-500">Authentication Provider</dt>
            <dd className="text-graphite-200 capitalize">{user?.provider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-graphite-500">Account Created</dt>
            <dd className="text-graphite-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-[11px] leading-relaxed text-graphite-600">
          This account is stored locally in your browser for demonstration purposes — see the note in
          hooks/useAuth.ts for the intended production upgrade path.
        </p>
      </div>
    </AppShell>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
