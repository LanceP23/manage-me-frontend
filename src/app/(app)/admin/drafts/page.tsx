"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import DraftGenerator from "@/features/drafts/components/DraftGenerator";
import StatusBadge from "@/shared/ui/StatusBadge";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import {
  approveDraft,
  getDrafts,
  rejectDraft,
  type Draft,
} from "@/shared/api/drafts";
import { useAuth } from "@/features/auth/store/useAuth";

function draftPriorityClass(priority?: string | null) {
  switch (priority) {
    case "high":
    case "urgent":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]";
    default:
      return "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]";
  }
}

export default function DraftsPage() {
  const { token, orgId, ready } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token || !orgId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getDrafts(token, orgId)
      .then((response) => {
        if (isMounted) {
          setDrafts(response.data ?? []);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load drafts.";
        setError(message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ready, token, orgId]);

  const refreshDrafts = async () => {
    if (!token || !orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDrafts(token, orgId);
      setDrafts(response.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load drafts.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onApprove = async (id: string) => {
    if (!token) return;
    setActionId(id);
    setError(null);
    try {
      await approveDraft(token, id, orgId ?? undefined);
      setDrafts((prev) => prev.filter((draft) => String(draft.id) !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve draft.";
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const onReject = async (id: string) => {
    if (!token) return;
    setActionId(id);
    setError(null);
    try {
      await rejectDraft(token, id, orgId ?? undefined);
      setDrafts((prev) => prev.filter((draft) => String(draft.id) !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject draft.";
      setError(message);
    } finally {
      setActionId(null);
    }
  };

  const metrics = useMemo(() => {
    const highConfidence = drafts.filter((draft) => (draft.confidence ?? 0) >= 0.9).length;
    return { total: drafts.length, highConfidence };
  }, [drafts]);

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}

      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Draft Workflow</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--mm-bone)]">
              Intake, decide, draft, then review
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mm-mist)]">
              Extend ticket drafting with issue decision support first, then resolve the draft into a new or existing ticket from a focused review page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="mm-pill">1. Analyze intake</span>
            <span className="mm-pill">2. Generate drafts</span>
            <span className="mm-pill">3. Review details</span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-xs text-[var(--mm-mist)]">Pending drafts</p>
            <p className="mt-1 text-xl font-semibold text-[var(--mm-bone)]">{metrics.total}</p>
          </div>
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-xs text-[var(--mm-mist)]">Above 90% confidence</p>
            <p className="mt-1 text-xl font-semibold text-[var(--mm-bone)]">{metrics.highConfidence}</p>
          </div>
        </div>
      </section>

      <Card
        id="draft-generator"
        eyebrow="Step 1 + 2"
        title="Issue intake with decision support"
        className="overflow-hidden"
      >
        <DraftGenerator onGenerated={refreshDrafts} />
      </Card>

      <section className="glass-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Step 3
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">
              Review pending drafts
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mm-mist)]">
              Use the dedicated draft page to inspect the full analysis, merge into existing work, or approve a clean new ticket.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-xs text-[var(--mm-mist)]">
            Detailed reasoning now lives on the draft detail page instead of expanding inside the queue.
          </div>
        </div>
      </section>

      <Table columns={4} headers={["Draft", "Summary", "Confidence", "Actions"]}>
        {isLoading ? <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading drafts...</div> : null}
        {error ? <div className="px-5 py-5 text-sm text-red-200">{error}</div> : null}
        {!isLoading && !error && drafts.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No drafts waiting for review.</div>
        ) : null}
        {drafts.map((draft) => {
          const draftId = String(draft.id);
          const hasSnapshot = Boolean(draft.decisionSnapshot);

          return (
            <TableRow key={draftId} columns={4}>
              <TableCell label="Draft" className="text-[var(--mm-bone)]">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">#{draftId}</span>
                  {draft.priority ? (
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${draftPriorityClass(draft.priority)}`}
                    >
                      {draft.priority}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell label="Summary" className="text-[var(--mm-mist)]">
                <div className="flex flex-col gap-1">
                  <span className="text-[var(--mm-bone)]">{draft.title}</span>
                  <span className="text-xs text-[var(--mm-mist)]">
                    {draft.source ? `Source: ${draft.source}` : "Draft review item"}
                  </span>
                </div>
              </TableCell>
              <TableCell label="Confidence" className="text-[var(--mm-teal)]">
                <div className="flex flex-col gap-1">
                  <span>{draft.confidence ? `${(draft.confidence * 100).toFixed(0)}%` : "-"}</span>
                  <span className="text-xs text-[var(--mm-mist)]">
                    {hasSnapshot ? "Decision snapshot attached" : "No decision snapshot"}
                  </span>
                </div>
              </TableCell>
              <TableCell label="Actions" className="flex flex-wrap items-center gap-2">
                <StatusBadge status={draft.status} />
                <div className="flex flex-wrap gap-2">
                  <Button
                    label="View Details"
                    variant="dark"
                    href={`/admin/drafts/${draftId}`}
                    className="px-3 py-1 text-xs"
                  />
                  <Button
                    label={actionId === draftId ? "Approving..." : "Approve"}
                    variant="ghost"
                    type="button"
                    disabled={actionId === draftId}
                    onClick={() => onApprove(draftId)}
                    className="px-3 py-1 text-xs"
                  />
                  <Button
                    label={actionId === draftId ? "Working..." : "Reject"}
                    variant="dark"
                    type="button"
                    disabled={actionId === draftId}
                    onClick={() => onReject(draftId)}
                    className="px-3 py-1 text-xs"
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}
