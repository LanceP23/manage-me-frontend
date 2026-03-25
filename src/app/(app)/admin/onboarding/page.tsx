"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useAuth } from "@/features/auth/store/useAuth";
import { getProducts } from "@/shared/api/products";
import { getIntegrationStatus } from "@/shared/api/integrations";
import { getDrafts } from "@/shared/api/drafts";
import { getAiLogs } from "@/shared/api/aiLogs";
import { getUsageSummary, type UsageSummary } from "@/shared/api/usage";
import { listOrganizationMembers } from "@/shared/api/organizations";

type ProductRow = {
  id: number;
};

type IntegrationRow = {
  provider: string;
};

type DraftRow = {
  id: string;
};

type LogRow = {
  id: string;
};

type MemberRow = {
  id: string;
};

type ChecklistStep = {
  id: string;
  label: string;
  detail: string;
  href: string;
  done: boolean;
};

export default function AdminOnboardingPage() {
  const { token, orgId, ready } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getProducts(token, orgId),
      getIntegrationStatus(token, orgId),
      getDrafts(token, orgId),
      getAiLogs(token, orgId),
      getUsageSummary(token, orgId),
      listOrganizationMembers(token, orgId, orgId),
    ])
      .then(([
        productsResponse,
        integrationsResponse,
        draftsResponse,
        logsResponse,
        usageResponse,
        membersResponse,
      ]) => {
        setProducts(productsResponse.data ?? []);
        setIntegrations(integrationsResponse.data ?? []);
        setDrafts(draftsResponse.data ?? []);
        setLogs(logsResponse.data ?? []);
        setMembers(membersResponse ?? []);
        setUsageSummary(usageResponse);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load onboarding status.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  const steps = useMemo<ChecklistStep[]>(() => {
    return [
      {
        id: "products",
        label: "Register product scope",
        detail: "Create at least one product to establish tenant boundaries.",
        href: "/admin/products",
        done: products.length > 0,
      },
      {
        id: "integrations",
        label: "Connect inbound channels",
        detail: "Configure GitHub or chat integrations for automated intake.",
        href: "/admin/integrations",
        done: integrations.length > 0,
      },
      {
        id: "drafts",
        label: "Generate first AI draft",
        detail: "Run initial drafting so your review workflow has live data.",
        href: "/admin/drafts",
        done: drafts.length > 0,
      },
      {
        id: "audit",
        label: "Verify audit trail",
        detail: "Ensure AI logs are captured for compliance and incident review.",
        href: "/admin/ai-logs",
        done: logs.length > 0,
      },
      {
        id: "team",
        label: "Invite at least one teammate",
        detail: "Set role-based access for operators beyond the owner account.",
        href: "/admin/team",
        done: members.length > 1,
      },
      {
        id: "automation",
        label: "Run guided agent action",
        detail: "Execute one guarded dry run before enabling broader automation.",
        href: "/admin/agent",
        done: logs.length > 0 || drafts.length > 0,
      },
    ];
  }, [drafts.length, integrations.length, logs.length, members.length, products.length]);

  const progress = useMemo(() => {
    const completed = steps.filter((step) => step.done).length;
    const total = steps.length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  }, [steps]);

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Onboarding</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Go-live checklist for startup teams</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Track setup status and complete required steps before broad rollout.
        </p>
      </section>

      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again.
        </div>
      ) : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      <div className="mm-grid cols-2">
        <Card eyebrow="Progress" title="Workspace readiness">
          {isLoading ? (
            <Skeleton lines={3} />
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                Completion:{" "}
                <span className="text-[var(--mm-bone)]">
                  {progress.completed}/{progress.total} ({progress.percent}%)
                </span>
              </p>
              <div className="h-2 overflow-hidden rounded-full border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--mm-teal),var(--mm-glow))]"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-xs text-[var(--mm-mist)]">
                Plan: {usageSummary?.plan.name ?? "—"} · Billing month: {usageSummary?.monthKey ?? "—"}
              </p>
            </div>
          )}
        </Card>

        <Card eyebrow="Activation" title="Recommended sequence">
          {isLoading ? (
            <Skeleton lines={5} />
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--mm-bone)]">{step.label}</p>
                      <p className="mt-1 text-xs text-[var(--mm-mist)]">{step.detail}</p>
                    </div>
                    {step.done ? (
                      <span className="rounded-full border border-[rgba(89,219,181,0.4)] bg-[rgba(89,219,181,0.14)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-teal)]">
                        Complete
                      </span>
                    ) : (
                      <Link
                        href={step.href}
                        className="rounded-full border border-[var(--mm-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-glow)] transition hover:border-[var(--mm-border-strong)]"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
