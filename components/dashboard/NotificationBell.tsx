"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Keep local copy in sync with polled data, but don't clobber optimistic
  // read-state the user just set locally while the dropdown is open.
  useEffect(() => {
    if (!open) setLocalNotifications(notifications);
  }, [notifications, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = localNotifications.filter((n) => !n.read).length;

  function handleOpenNotification(n: AppNotification) {
    setLocalNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    startTransition(() => markNotificationRead(n.id));
    setOpen(false);
    router.push(n.link);
  }

  function handleMarkAllRead() {
    setLocalNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded border border-outline-variant/30 flex items-center justify-center bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
        title="Notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error text-[9px] font-mono font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-80 glass-panel border-outline-variant/30 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
            <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-on-surface-variant/40 hover:text-on-surface transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {localNotifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] font-mono text-on-surface-variant/40">
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {localNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenNotification(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-surface-container transition-colors",
                    !n.read && "bg-surface-container-low"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                    <div className="min-w-0">
                      <p className="text-[12px] text-on-surface leading-snug">{n.message}</p>
                      <p className="text-[10px] font-mono text-on-surface-variant/40 mt-0.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
