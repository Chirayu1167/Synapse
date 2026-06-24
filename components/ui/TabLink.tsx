"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function TabLink({
  projectId,
  href,
  label,
  icon,
}: {
  projectId: string;
  href: string;
  label: string;
  icon?: string;
}) {
  const pathname = usePathname();
  const fullHref = `/projects/${projectId}/${href}`;
  const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

  return (
    <Link
      href={fullHref}
      className={cn(
        "flex items-center gap-1.5 flex-1 px-3 py-2.5 text-base font-mono uppercase tracking-widest border-b-2 transition-colors text-center",
        isActive
          ? "border-on-surface text-on-surface"
          : "border-transparent text-on-surface-variant/50 hover:text-on-surface-variant hover:border-outline-variant/40"
      )}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      )}
      {label}
    </Link>
  );
}
