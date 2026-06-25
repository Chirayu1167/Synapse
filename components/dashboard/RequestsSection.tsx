"use client";

import { useTransition } from "react";
import { acceptMembershipRequest, declineMembershipRequest } from "@/lib/actions";

export type SidebarMembershipRequest = {
  id: string;
  status: "invited" | "pending_approval";
  project: { id: string; name: string } | null;
};

export default function RequestsSection({ requests }: { requests: SidebarMembershipRequest[] }) {
  const [isPending, startTransition] = useTransition();

  if (!requests || requests.length === 0) return null;

  return (
    <div className="mt-7">
      <p className="px-6 mb-2 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40">
        Requests
      </p>
      <div className="px-6 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="border border-outline-variant/20 rounded p-3">
            <p className="text-sm text-on-surface truncate mb-0.5">{r.project?.name ?? "Unknown project"}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
              {r.status === "invited" ? "Invited to join" : "Awaiting owner approval"}
            </p>
            {r.status === "invited" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startTransition(() => acceptMembershipRequest(r.id))}
                  disabled={isPending}
                  className="text-[10px] font-mono uppercase tracking-widest text-on-surface hover:underline"
                >
                  Accept
                </button>
                <button
                  onClick={() => startTransition(() => declineMembershipRequest(r.id))}
                  disabled={isPending}
                  className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/30 hover:text-error transition-colors"
                >
                  Decline
                </button>
              </div>
            ) : (
              <button
                onClick={() => startTransition(() => declineMembershipRequest(r.id))}
                disabled={isPending}
                className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/30 hover:text-error transition-colors"
              >
                Withdraw
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
