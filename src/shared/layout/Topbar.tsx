"use client";

import Button from "@/shared/ui/Button";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { useAuth } from "@/features/auth/store/useAuth";
import { Bell, PanelLeftOpen, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

type TopbarProps = {
  title: string;
  subtitle: string;
  onToggleNav?: () => void;
};

export default function Topbar({ title, subtitle, onToggleNav }: TopbarProps) {
  const { isAdmin, orgName } = useAuth();
  const pathname = usePathname();

  const ctaMap: Record<string, { label: string; href: string }> = {
    "/app": { label: "Generate Drafts", href: "#draft-generator" },
    "/app/tickets": { label: "Open Ticket Queue", href: "/app/tickets" },
    "/admin": { label: "Open Onboarding", href: "/admin/onboarding" },
    "/admin/onboarding": { label: "Open Integrations", href: "/admin/integrations" },
    "/admin/team": { label: "Open Usage", href: "/admin/usage" },
    "/admin/usage": { label: "Open Overview", href: "/admin" },
    "/admin/drafts": { label: "Jump to Generator", href: "#draft-generator" },
    "/admin/products": { label: "Add Product", href: "#product-create" },
    "/admin/ai-logs": { label: "Export Logs", href: "#ai-export" },
    "/admin/agent": { label: "Run Agent", href: "#agent-run" },
  };

  const cta = ctaMap[pathname] ?? (isAdmin && pathname.startsWith("/app")
    ? { label: "Open Admin", href: "/admin" }
    : undefined);
  const pageHintMap: Array<{ match: string; hint: string }> = [
    { match: "/app/tickets", hint: "Ticket operations" },
    { match: "/admin/drafts", hint: "Draft review queue" },
    { match: "/admin/products", hint: "Product registry" },
    { match: "/admin/integrations", hint: "Integration control" },
    { match: "/admin/onboarding", hint: "Go-live setup checklist" },
    { match: "/admin/team", hint: "Roles and member access" },
    { match: "/admin/usage", hint: "Plan and consumption analytics" },
    { match: "/admin/agent", hint: "Agent execution console" },
    { match: "/admin/ai-logs", hint: "Audit logs and exports" },
  ];
  const pageHint =
    pageHintMap.find((item) => pathname.startsWith(item.match))?.hint ??
    "Operational workspace";
  const now = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div className="mm-panel mm-topbar px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.09em] text-[var(--mm-mist)]">
          {subtitle}
        </p>
        <h2 className="mt-1 truncate text-xl font-semibold text-[var(--mm-bone)]">{title}</h2>
        <p className="mt-1 text-xs text-[var(--mm-mist)]">{pageHint}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="mm-nav-toggle md:hidden"
          onClick={onToggleNav}
          aria-label="Open navigation"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" /> Menu
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-[var(--mm-border)] px-3 py-2 text-xs text-[var(--mm-mist)] lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-[var(--mm-teal)]" />
          Agent online
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-[var(--mm-border)] px-3 py-2 text-xs text-[var(--mm-mist)] md:flex">
          <Bell className="h-3.5 w-3.5" />
          {orgName ?? "No org"} · {now}
        </div>

        {cta ? <Button label={cta.label} href={cta.href} className="px-4" /> : null}
        <LogoutButton />
      </div>
    </div>
  );
}
