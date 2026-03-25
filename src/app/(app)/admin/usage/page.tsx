"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Select from "@/shared/ui/Select";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  getUsageEvents,
  getUsageSummary,
  type UsageEvent,
  type UsageSummary,
} from "@/shared/api/usage";
import { useAuth } from "@/features/auth/store/useAuth";

const kindOptions = [
  { value: "all", label: "All event types" },
  { value: "ai_prompt", label: "AI Prompt" },
  { value: "ticket_draft", label: "Ticket Draft" },
  { value: "agent_action", label: "Agent Action" },
  { value: "commit_link", label: "Commit Link" },
  { value: "integration_draft", label: "Integration Draft" },
];

const limitOptions = [
  { value: "10", label: "Last 10" },
  { value: "25", label: "Last 25" },
  { value: "50", label: "Last 50" },
];

const usageKeys: Array<{
  key: keyof UsageSummary["usage"];
  label: string;
}> = [
  { key: "aiPrompts", label: "AI prompts" },
  { key: "ticketDrafts", label: "Ticket drafts" },
  { key: "agentActions", label: "Agent actions" },
  { key: "commitLinks", label: "Commit links" },
  { key: "integrationDrafts", label: "Integration drafts" },
];

function formatKindLabel(kind: string) {
  return kind.replaceAll("_", " ");
}

export default function UsagePage() {
  const { token, orgId, ready } = useAuth();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [kind, setKind] = useState("all");
  const [limit, setLimit] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsSummaryLoading(true);
    setError(null);

    getUsageSummary(token, orgId)
      .then((response) => {
        setSummary(response);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load usage summary.";
        setError(message);
      })
      .finally(() => {
        setIsSummaryLoading(false);
      });
  }, [ready, token, orgId]);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsEventsLoading(true);
    setError(null);

    getUsageEvents(token, orgId, {
      limit: Number(limit),
      kind: kind === "all" ? undefined : kind,
    })
      .then((response) => {
        setEvents(response.events ?? []);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load usage events.";
        setError(message);
      })
      .finally(() => {
        setIsEventsLoading(false);
      });
  }, [kind, limit, orgId, ready, token]);

  const totalUsage = useMemo(() => {
    if (!summary) return null;
    const used =
      summary.usage.aiPrompts +
      summary.usage.ticketDrafts +
      summary.usage.agentActions +
      summary.usage.commitLinks +
      summary.usage.integrationDrafts;
    const limitTotal =
      Number(summary.limits.aiPrompts ?? 0) +
      Number(summary.limits.ticketDrafts ?? 0) +
      Number(summary.limits.agentActions ?? 0) +
      Number(summary.limits.commitLinks ?? 0) +
      Number(summary.limits.integrationDrafts ?? 0);
    const unlimited = limitTotal === 0;
    return {
      used,
      limitTotal,
      unlimited,
      percent: unlimited ? 0 : Math.round((used / limitTotal) * 100),
    };
  }, [summary]);

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Usage Analytics</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Plan limits, monthly consumption, and event history</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Track spend-sensitive metrics and operational intensity across your organization.
        </p>
      </section>

      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again.
        </div>
      ) : null}
      {error ? <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div> : null}

      <div className="mm-grid cols-2">
        <Card eyebrow="Summary" title="Monthly plan usage">
          {isSummaryLoading ? (
            <Skeleton lines={3} />
          ) : summary ? (
            <div className="space-y-3 text-sm">
              <p>
                Plan: <span className="text-[var(--mm-bone)]">{summary.plan.name}</span>
              </p>
              <p>
                Month key: <span className="text-[var(--mm-bone)]">{summary.monthKey}</span>
              </p>
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
                <p className="text-xs text-[var(--mm-mist)]">Total activity</p>
                <p className="mt-1 text-base font-semibold text-[var(--mm-bone)]">
                  {totalUsage?.unlimited
                    ? `${totalUsage.used} events (unlimited)`
                    : `${totalUsage?.used ?? 0} / ${totalUsage?.limitTotal ?? 0} (${totalUsage?.percent ?? 0}%)`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--mm-mist)]">Usage summary unavailable.</p>
          )}
        </Card>

        <Card eyebrow="Filters" title="Event query">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Event type"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              options={kindOptions}
            />
            <Select
              label="Window"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              options={limitOptions}
            />
          </div>
        </Card>
      </div>

      <Card eyebrow="Breakdown" title="Category utilization">
        {isSummaryLoading ? (
          <Skeleton lines={5} />
        ) : summary ? (
          <div className="space-y-3">
            {usageKeys.map((item) => {
              const used = Number(summary.usage[item.key] ?? 0);
              const limitValue = Number(summary.limits[item.key] ?? 0);
              const unlimited = limitValue === 0;
              const percent = unlimited ? 0 : Math.round((used / limitValue) * 100);
              return (
                <div key={item.key} className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--mm-bone)]">{item.label}</span>
                    <span className="text-[var(--mm-mist)]">
                      {unlimited ? `${used} / unlimited` : `${used} / ${limitValue} (${percent}%)`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--mm-teal),var(--mm-glow))]"
                      style={{ width: unlimited ? "24%" : `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--mm-mist)]">No breakdown available.</p>
        )}
      </Card>

      <Table columns={4} headers={["Event", "Quantity", "Timestamp", "Metadata"]}>
        {isEventsLoading ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading usage events...</div>
        ) : null}
        {!isEventsLoading && events.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">
            No usage events found for the selected filter.
          </div>
        ) : null}
        {events.map((event) => (
          <TableRow key={event.id} columns={4}>
            <TableCell label="Event" className="text-[var(--mm-bone)]">
              {formatKindLabel(event.kind)}
            </TableCell>
            <TableCell label="Quantity" className="text-[var(--mm-mist)]">
              {event.quantity}
            </TableCell>
            <TableCell label="Timestamp" className="text-[var(--mm-mist)]">
              {new Date(event.createdAt).toLocaleString()}
            </TableCell>
            <TableCell label="Metadata" className="text-[var(--mm-mist)]">
              {event.metadata ? JSON.stringify(event.metadata) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
