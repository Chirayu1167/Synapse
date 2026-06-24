"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Project, ProjectMember, PendingInvite } from "@/lib/types";
import { updateProject, deleteProject, inviteMember, removeMember, cancelInvite } from "@/lib/actions";
import { initials } from "@/lib/utils";

interface Props {
  project: Project;
  members: ProjectMember[];
  pendingInvites: PendingInvite[];
  currentUserId: string;
}

export default function ProjectSettings({ project, members, pendingInvites, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  function handleUpdateProject(formData: FormData) {
    startTransition(() => updateProject(project.id, formData));
  }

  function handleDeleteProject() {
    startTransition(() => deleteProject(project.id));
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError("");
    const fd = new FormData();
    fd.set("email", inviteEmail.trim());
    startTransition(async () => {
      try {
        await inviteMember(project.id, fd);
        setInviteEmail("");
      } catch (err: any) {
        setInviteError(err.message ?? "Failed to invite");
      }
    });
  }

  return (
    <div className="p-4 space-y-4">
      {/* Project details */}
      <section className="glass-panel p-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-4">
          // PROJECT DETAILS
        </p>
        <form action={handleUpdateProject} className="space-y-5">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
              Project name
            </label>
            <input name="name" defaultValue={project.name} required className="input-base" />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={project.description ?? ""}
              rows={4}
              className="input-base resize-none"
            />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
            Save changes
          </button>
        </form>
      </section>

      {/* Members */}
      <section className="glass-panel p-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-4">
          // TEAM MEMBERS
        </p>

        <form onSubmit={handleInvite} className="flex gap-3 mb-6">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="input-base flex-1"
          />
          <button type="submit" disabled={isPending || !inviteEmail.trim()} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
            Invite
          </button>
        </form>
        {inviteError && (
          <p className="text-[11px] font-mono text-error mb-4">{inviteError}</p>
        )}

        <div className="space-y-1">
          {members.map((member: any) => {
            const u = member.user;
            const isSelf = u?.id === currentUserId;
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 py-3 border-b border-outline-variant/15 last:border-0"
              >
                {u?.avatar_url ? (
                  <Image src={u.avatar_url} alt="" width={32} height={32} className="rounded-full shrink-0 border border-outline-variant/30" />
                ) : (
                  <div className="w-[32px] h-[32px] rounded-full border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant/70 text-[10px] font-mono font-semibold">
                    {initials(u?.display_name, u?.email)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base text-on-surface truncate">
                    {u?.display_name ?? u?.email}{isSelf ? " (you)" : ""}
                  </p>
                  {u?.display_name && (
                    <p className="text-[11px] font-mono text-on-surface-variant/40 truncate">{u?.email}</p>
                  )}
                </div>
                <span className="badge">{member.role}</span>
                {!isSelf && member.role !== "owner" && (
                  <RemoveMemberButton
                    projectId={project.id}
                    userId={u?.id}
                    name={u?.display_name ?? u?.email ?? "this member"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {pendingInvites.length > 0 && (
          <div className="mt-5 pt-4 border-t border-outline-variant/20">
            <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-3">Pending invites</p>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2">
                  <span className="text-[11px] font-mono text-on-surface-variant font-mono">{invite.invited_email}</span>
                  <div className="flex items-center gap-3">
                    <span className="badge border-outline-variant/20 text-on-surface-variant/40">pending</span>
                    <CancelInviteButton inviteId={invite.id} projectId={project.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="glass-panel p-6 border border-error/20">
        <p className="text-[11px] font-mono uppercase tracking-widest text-error/70 mb-1">// DANGER ZONE</p>
        <p className="text-mono-label font-mono-label text-on-surface-variant/50 mb-4">
          Deleting a project permanently removes all tasks, todos, activity, and context. This cannot be undone.
        </p>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-mono uppercase tracking-widest text-error">Are you sure?</p>
            <button onClick={handleDeleteProject} disabled={isPending} className="btn-danger border border-error/20">
              Yes, delete project
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-danger border border-error/20">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_forever</span>
            Delete this project
          </button>
        )}
      </section>
    </div>
  );
}

function RemoveMemberButton({ projectId, userId, name }: { projectId: string; userId: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-mono">
        <button
          onClick={() => startTransition(() => removeMember(projectId, userId))}
          disabled={isPending}
          className="text-error hover:underline"
        >
          Remove
        </button>
        <button onClick={() => setConfirm(false)} className="text-on-surface-variant/40 hover:underline">Cancel</button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-[10px] font-mono text-on-surface-variant/30 hover:text-error transition-colors uppercase tracking-widest"
    >
      Remove
    </button>
  );
}

function CancelInviteButton({ inviteId, projectId }: { inviteId: string; projectId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => cancelInvite(inviteId, projectId))}
      disabled={isPending}
      className="text-[10px] font-mono text-on-surface-variant/30 hover:text-error transition-colors uppercase tracking-widest"
    >
      Cancel
    </button>
  );
}
