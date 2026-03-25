"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import DraftGenerator from "@/features/drafts/components/DraftGenerator";
import { getTickets } from "@/shared/api/tickets";
import { getDrafts } from "@/shared/api/drafts";
import { getProducts } from "@/shared/api/products";
import { getIntegrationStatus } from "@/shared/api/integrations";
import { useAuth } from "@/features/auth/store/useAuth";
import { Skeleton } from "@/shared/ui/Skeleton";

type TicketRow = {
  id: string;
  status: string;
};

type DraftRow = {
  id: string;
  confidence?: number | null;
};

type ProductRow = {
  id: number;
};

type IntegrationRow = {
  provider: string;
};

export default function AppHomePage() {
  const { token, orgId, ready, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getTickets(token, orgId),
      getDrafts(token, orgId),
      getProducts(token, orgId),
      getIntegrationStatus(token, orgId),
    ])
      .then(([ticketResponse, draftResponse, productResponse, integrationResponse]) => {
        setTickets(ticketResponse.data ?? []);
        setDrafts(draftResponse.data ?? []);
        setProducts(productResponse.data ?? []);
        setIntegrations(integrationResponse.data ?? []);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard data.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  const metrics = useMemo(() => {
    const total = tickets.length;
    const inProgress = tickets.filter(
      (ticket) => ticket.status === "in_progress"
    ).length;
    const blocked = tickets.filter((ticket) => ticket.status === "blocked").length;
    const highConfidenceDrafts = drafts.filter(
      (draft) => (draft.confidence ?? 0) >= 0.9
    ).length;

    return {
      total,
      inProgress,
      blocked,
      draftsToday: drafts.length,
      highConfidenceDrafts,
      slaRisk: blocked,
    };
  }, [tickets, drafts]);

  const setupProgress = useMemo(() => {
    const steps = isAdmin
      ? [
          { id: "product", label: "Create at least one product", done: products.length > 0, href: "/admin/products" },
          { id: "integration", label: "Connect at least one integration", done: integrations.length > 0, href: "/admin/integrations" },
          { id: "draft", label: "Generate your first AI draft", done: drafts.length > 0, href: "#draft-generator" },
          { id: "ticket", label: "Create your first ticket", done: tickets.length > 0, href: "/app/tickets" },
        ]
      : [
          { id: "draft", label: "Generate your first AI draft", done: drafts.length > 0, href: "#draft-generator" },
          { id: "ticket", label: "Create your first ticket", done: tickets.length > 0, href: "/app/tickets" },
          { id: "queue", label: "Review queue health daily", done: tickets.length > 0, href: "/app/tickets" },
          { id: "profile", label: "Confirm profile and org context", done: true, href: "/app/profile" },
        ];
    const completed = steps.filter((step) => step.done).length;
    return {
      completed,
      total: steps.length,
      steps,
      percent: Math.round((completed / steps.length) * 100),
    };
  }, [drafts.length, integrations.length, isAdmin, products.length, tickets.length]);

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Mission Control</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Prioritize tickets, then review AI draft output</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Keep queue throughput stable by resolving blocked work first and approving high-confidence suggestions.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Open tickets</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.total}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">In progress</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.inProgress}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Drafts today</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.draftsToday}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">SLA risk</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.slaRisk}</p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mm-grid cols-2">
        <Card id="draft-generator" eyebrow="Action" title="Generate AI drafts">
          <DraftGenerator />
        </Card>
        <Card eyebrow="Go-Live Checklist" title="Startup onboarding progress">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <p className="text-xs text-[var(--mm-mist)]">Workspace setup</p>
                <p className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
                  {setupProgress.completed}/{setupProgress.total} complete ({setupProgress.percent}%)
                </p>
              </div>
              {setupProgress.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2"
                >
                  <span className={step.done ? "text-[var(--mm-bone)]" : "text-[var(--mm-mist)]"}>
                    {step.label}
                  </span>
                  {step.done ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--mm-teal)]">Done</span>
                  ) : (
                    <Link
                      href={step.href}
                      className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--mm-glow)]"
                    >
                      Open
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card eyebrow="Queue Health" title="What needs attention">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Blocked tickets</span>
                <span className="font-semibold text-[var(--mm-bone)]">{metrics.blocked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>High confidence drafts</span>
                <span className="font-semibold text-[var(--mm-bone)]">{metrics.highConfidenceDrafts}</span>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(110,185,255,0.12)] px-3 py-2 text-xs text-[var(--mm-bone)]">
                Focus first on blocked tickets, then clear draft approvals.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
