import type { ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BadgeCheck,
  Bot,
  Cable,
  ClipboardCheck,
  FileText,
  Home,
  LifeBuoy,
  Package,
  Users2,
  User,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  hint?: string;
};

type SidebarProps = {
  title: string;
  subtitle: string;
  items: NavItem[];
  activePath?: string | null;
  onNavigate?: () => void;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Overview: Home,
  Tickets: LifeBuoy,
  Profile: User,
  "Admin Overview": Home,
  Onboarding: ClipboardCheck,
  Team: Users2,
  Usage: BarChart3,
  "AI Drafts": FileText,
  Products: Package,
  Integrations: Cable,
  Agent: Bot,
  "AI Logs": Activity,
};

function isItemActive(activePath: string | null | undefined, href: string) {
  if (!activePath) return false;
  if (activePath === href) return true;
  if (href === "/app" || href === "/admin") return false;
  return activePath.startsWith(`${href}/`);
}

export default function Sidebar({
  title,
  subtitle,
  items,
  activePath,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="mm-panel mm-sidebar-panel flex h-full flex-col gap-6 p-4">
      <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--mm-border-strong)] bg-[rgba(110,185,255,0.14)] text-sm font-bold text-[var(--mm-bone)]">
            MM
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.09em] text-[var(--mm-mist)]">
              {subtitle}
            </p>
            <h1 className="text-sm font-semibold text-[var(--mm-bone)]">{title}</h1>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => {
          const isActive = isItemActive(activePath, item.href);
          const Icon = iconMap[item.label] ?? BadgeCheck;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mm-nav-link ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </span>
                {item.hint ? (
                  <span className="rounded-full border border-[var(--mm-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                    {item.hint}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4 text-xs text-[var(--mm-mist)]">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--mm-teal)]">
          Active Mission
        </p>
        <p className="mt-2 text-[var(--mm-bone)]">Review AI output and push decisions to tickets.</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--mm-border)] bg-[rgba(110,185,255,0.12)] px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--mm-bone)]">
          <span className="h-2 w-2 rounded-full bg-[var(--mm-teal)]" />
          Agent Ready
        </div>
      </div>
    </aside>
  );
}
