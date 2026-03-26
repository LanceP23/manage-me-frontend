"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, PauseCircle } from "lucide-react";
import Sidebar, { NavItem } from "@/shared/layout/Sidebar";
import Topbar from "@/shared/layout/Topbar";
import { useAuth } from "@/features/auth/store/useAuth";
import { ToastProvider } from "@/shared/ui/toast";

const appNav: NavItem[] = [
  { label: "Overview", href: "/app", hint: "Live" },
  { label: "Tickets", href: "/app/tickets" },
  { label: "Profile", href: "/app/profile" },
];

const adminNav: NavItem[] = [
  { label: "Admin Overview", href: "/admin", hint: "HQ" },
  { label: "Onboarding", href: "/admin/onboarding", hint: "Setup" },
  { label: "Team", href: "/admin/team" },
  { label: "Usage", href: "/admin/usage" },
  { label: "AI Drafts", href: "/admin/drafts" },
  { label: "Products", href: "/admin/products" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Agent", href: "/admin/agent", hint: "Auto" },
  { label: "AI Logs", href: "/admin/ai-logs" },
];

type AppShellProps = {
  variant: "app" | "admin";
  title: string;
  subtitle: string;
  children: ReactNode;
};

const appShortcuts = [
  { label: "Open ticket queue", href: "/app/tickets" },
  { label: "Create draft", href: "/app#draft-generator" },
  { label: "Review profile", href: "/app/profile" },
];

const adminShortcuts = [
  { label: "Run onboarding checklist", href: "/admin/onboarding" },
  { label: "Manage team access", href: "/admin/team" },
  { label: "Review usage analytics", href: "/admin/usage" },
  { label: "Approve drafts", href: "/admin/drafts" },
  { label: "Check integrations", href: "/admin/integrations" },
  { label: "Inspect agent runs", href: "/admin/agent" },
];

export default function AppShell({
  variant,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const shellTitle = variant === "admin" ? "Manage Me Admin" : "Manage Me";
  const shellSubtitle = variant === "admin" ? "Admin" : "App";
  const shortcuts = variant === "admin" ? adminShortcuts : appShortcuts;
  const { isAdmin } = useAuth();

  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const items =
    variant === "app" && isAdmin
      ? [...appNav, { label: "Admin Overview", href: "/admin", hint: "Switch" }]
      : variant === "admin"
        ? adminNav
        : appNav;

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className="mm-shell">
        <div className="mm-frame">
          <div className={`mm-sidebar ${navOpen ? "is-open" : ""}`}>
            <Sidebar
              title={shellTitle}
              subtitle={shellSubtitle}
              items={items}
              activePath={pathname}
              onNavigate={() => setNavOpen(false)}
            />
          </div>

          {navOpen ? (
            <button
              type="button"
              className="mm-scrim"
              aria-label="Close navigation"
              onClick={() => setNavOpen(false)}
            />
          ) : null}

          <div className="mm-content">
            <Topbar
              title={title}
              subtitle={subtitle}
              onToggleNav={() => setNavOpen(true)}
            />
            <main className="mm-panel mm-main-panel">{children}</main>
          </div>

          <aside className="mm-context-rail">
            <div className="mm-panel mm-context-card">
              <p className="mm-context-label">Quick Actions</p>
              <h3 className="mm-context-title">Move work forward</h3>
              {shortcuts.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className="mm-context-link">
                  <span>{shortcut.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>

            <div className="mm-panel mm-context-card">
              <p className="mm-context-label">Agent Queue</p>
              <h3 className="mm-context-title">Execution states</h3>
              <div className="mm-context-state">
                <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />Queued</span>
                <strong>Live</strong>
              </div>
              <div className="mm-context-state">
                <span className="flex items-center gap-2"><PauseCircle className="h-3.5 w-3.5" />Needs review</span>
                <strong>Live</strong>
              </div>
              <div className="mm-context-state">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" />Completed</span>
                <strong>Live</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ToastProvider>
  );
}
