"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import { getDrafts } from "@/shared/api/drafts";
import { getAiLogs } from "@/shared/api/aiLogs";
import { getIntegrationStatus } from "@/shared/api/integrations";
import { getProducts } from "@/shared/api/products";
import {
  getUsageEvents,
  getUsageSummary,
  type UsageEvent,
  type UsageSummary,
} from "@/shared/api/usage";
import { listOrganizationMembers } from "@/shared/api/organizations";
import { useAuth } from "@/features/auth/store/useAuth";
import { Skeleton } from "@/shared/ui/Skeleton";

type DraftRow = {
  id: string;
  confidence?: number | null;
};

type AiLogRow = {
  id: string;
};

type IntegrationRow = {
  provider: string;
  status: "active" | "degraded" | "unknown";
};

type ProductRow = {
  id: number;
};

type MemberRow = {
  id: string;
};

export default function AdminHomePage() {
  const { token, orgId, ready } = useAuth();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLogRow[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getDrafts(token, orgId),
      getAiLogs(token, orgId),
      getIntegrationStatus(token, orgId),
      getProducts(token, orgId),
      getUsageSummary(token, orgId),
      getUsageEvents(token, orgId, { limit: 5 }),
      listOrganizationMembers(token, orgId, orgId),
    ])
      .then(([
        draftResponse,
        logResponse,
        integrationResponse,
        productResponse,
        usageResponse,
        usageEventsResponse,
        membersResponse,
      ]) => {
        setDrafts(draftResponse.data ?? []);
        setAiLogs(logResponse.data ?? []);
        setIntegrations(integrationResponse.data ?? []);
        setProducts(productResponse.data ?? []);
        setUsageSummary(usageResponse);
        setUsageEvents(usageEventsResponse.events ?? []);
        setMembers(membersResponse ?? []);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load admin metrics.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  const metrics = useMemo(() => {
    const highConfidence = drafts.filter(
      (draft) => (draft.confidence ?? 0) >= 0.9
    ).length;
    const degraded = integrations.filter(
      (integration) => integration.status === "degraded"
    ).length;

    return {
      drafts: drafts.length,
      highConfidence,
      logCount: aiLogs.length,
      integrationCount: integrations.length,
      productCount: products.length,
      memberCount: members.length,
      degraded,
    };
  }, [drafts, aiLogs, integrations, members, products]);

  const usageStats = useMemo(() => {
    if (!usageSummary) {
      return null;
    }
    const totalUsed =
      usageSummary.usage.aiPrompts +
      usageSummary.usage.ticketDrafts +
      usageSummary.usage.agentActions +
      usageSummary.usage.commitLinks +
      usageSummary.usage.integrationDrafts;
    const totalLimit =
      Number(usageSummary.limits.aiPrompts ?? 0) +
      Number(usageSummary.limits.ticketDrafts ?? 0) +
      Number(usageSummary.limits.agentActions ?? 0) +
      Number(usageSummary.limits.commitLinks ?? 0) +
      Number(usageSummary.limits.integrationDrafts ?? 0);
    const isUnlimited = totalLimit === 0;
    const percent = isUnlimited ? 0 : Math.round((totalUsed / totalLimit) * 100);
    return {
      totalUsed,
      totalLimit,
      percent,
      isUnlimited,
    };
  }, [usageSummary]);

  const setupProgress = useMemo(() => {
    const steps = [
      { id: "product", label: "Product created", done: products.length > 0, href: "/admin/products" },
      { id: "integration", label: "Integration configured", done: integrations.length > 0, href: "/admin/integrations" },
      { id: "draft", label: "Draft generated", done: drafts.length > 0, href: "/admin/drafts" },
      { id: "team", label: "Team access configured", done: members.length > 1, href: "/admin/team" },
      { id: "logs", label: "Audit logs recorded", done: aiLogs.length > 0, href: "/admin/ai-logs" },
    ];
    const completed = steps.filter((step) => step.done).length;
    return {
      steps,
      completed,
      total: steps.length,
      percent: Math.round((completed / steps.length) * 100),
    };
  }, [aiLogs.length, drafts.length, integrations.length, members.length, products.length]);

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Admin Mission</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Keep agent output safe, traceable, and shippable</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Review execution confidence, export evaluation logs, and resolve degraded integrations before impact spreads.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Draft queue</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.drafts}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">High confidence</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.highConfidence}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">AI logs</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.logCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Products</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.productCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Team members</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.memberCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
                <p className="text-xs text-[var(--mm-mist)]">Degraded providers</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--mm-bone)]">{metrics.degraded}</p>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="mm-grid cols-2">
        <Card eyebrow="Compliance" title="Audit readiness">
          {isLoading ? (
            <Skeleton lines={2} />
          ) : (
            <div className="space-y-2">
              <p>Retention policy active for organization-scoped logs.</p>
              <p className="text-xs text-[var(--mm-mist)]">Use AI Logs to export CSV snapshots for incident reviews.</p>
            </div>
          )}
        </Card>
        <Card eyebrow="Integrations" title="Event throughput">
          {isLoading ? (
            <Skeleton lines={2} />
          ) : (
            <div className="space-y-2">
              <p>{metrics.integrationCount} integrations reporting status.</p>
              <p className="text-xs text-[var(--mm-mist)]">Investigate degraded providers before enabling broader auto-exec.</p>
            </div>
          )}
        </Card>
        <Card eyebrow="Usage" title="Plan and monthly consumption">
          {isLoading ? (
            <Skeleton lines={3} />
          ) : usageSummary ? (
            <div className="space-y-2 text-sm">
              <p>
                Plan: <span className="text-[var(--mm-bone)]">{usageSummary.plan.name}</span>
              </p>
              <p>
                Month: <span className="text-[var(--mm-bone)]">{usageSummary.monthKey}</span>
              </p>
              <p className="text-xs text-[var(--mm-mist)]">
                Total events:{" "}
                {usageStats?.isUnlimited
                  ? `${usageStats.totalUsed} (unlimited plan)`
                  : `${usageStats?.totalUsed ?? 0} / ${usageStats?.totalLimit ?? 0} (${usageStats?.percent ?? 0}%)`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--mm-mist)]">Usage data unavailable.</p>
          )}
        </Card>
        <Card eyebrow="Go-Live Checklist" title="Customer readiness">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <p className="text-xs text-[var(--mm-mist)]">Setup status</p>
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
        <Card eyebrow="Usage Events" title="Latest activity">
          {isLoading ? (
            <Skeleton lines={4} />
          ) : usageEvents.length === 0 ? (
            <p className="text-xs text-[var(--mm-mist)]">No usage events recorded yet.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {usageEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2"
                >
                  <p className="font-medium uppercase tracking-[0.06em] text-[var(--mm-bone)]">
                    {event.kind.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-[var(--mm-mist)]">
                    Qty {event.quantity} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
