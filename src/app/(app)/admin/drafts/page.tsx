"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import DraftGenerator from "@/features/drafts/components/DraftGenerator";
import StatusBadge from "@/shared/ui/StatusBadge";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { approveDraft, getDrafts, rejectDraft } from "@/shared/api/drafts";
import { useAuth } from "@/features/auth/store/useAuth";

type DraftRow = {
  id: string;
  title: string;
  confidence?: number | null;
  status?: string | null;
};

export default function DraftsPage() {
  const { token, orgId, ready } = useAuth();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    refreshDrafts();
  }, [ready, token, orgId]);

  const onApprove = async (id: string) => {
    if (!token) return;
    setActionId(id);
    setError(null);
    try {
      await approveDraft(token, id, orgId ?? undefined);
      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
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
      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject draft.";
      setError(message);
    } finally {
      setActionId(null);
    }
  };

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
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Draft Queue</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Review AI output before execution</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

      <div className="mm-grid cols-2">
        <Card id="draft-generator" eyebrow="Generate" title="AI draft intake">
          <DraftGenerator onGenerated={refreshDrafts} />
        </Card>
        <Card eyebrow="Queue Rules" title="Review policy">
          <p>
            Approve high-confidence drafts when safe, reject weak or ambiguous
            suggestions, and keep the queue moving continuously.
          </p>
        </Card>
      </div>

      <Table columns={4} headers={["Draft", "Summary", "Confidence", "Actions"]}>
        {isLoading ? <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading drafts...</div> : null}
        {error ? <div className="px-5 py-5 text-sm text-red-200">{error}</div> : null}
        {!isLoading && !error && drafts.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No drafts waiting for review.</div>
        ) : null}
        {drafts.map((draft) => (
          <TableRow key={draft.id} columns={4}>
            <TableCell label="Draft" className="text-[var(--mm-bone)]">
              {draft.id}
            </TableCell>
            <TableCell label="Summary" className="text-[var(--mm-mist)]">
              {draft.title}
            </TableCell>
            <TableCell label="Confidence" className="text-[var(--mm-teal)]">
              {draft.confidence ? `${(draft.confidence * 100).toFixed(0)}%` : "—"}
            </TableCell>
            <TableCell label="Actions" className="flex flex-wrap items-center gap-2">
              <StatusBadge status={draft.status} />
              <div className="flex flex-wrap gap-2">
                <Button
                  label={actionId === draft.id ? "Approving..." : "Approve"}
                  variant="ghost"
                  type="button"
                  disabled={actionId === draft.id}
                  onClick={() => onApprove(draft.id)}
                  className="px-3 py-1 text-xs"
                />
                <Button
                  label={actionId === draft.id ? "Working..." : "Reject"}
                  variant="dark"
                  type="button"
                  disabled={actionId === draft.id}
                  onClick={() => onReject(draft.id)}
                  className="px-3 py-1 text-xs"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
