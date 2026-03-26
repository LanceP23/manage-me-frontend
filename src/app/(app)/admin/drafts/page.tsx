"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import DraftGenerator from "@/features/drafts/components/DraftGenerator";
import StatusBadge from "@/shared/ui/StatusBadge";
import {
  approveDraft,
  getDrafts,
  rejectDraft,
  type Draft,
} from "@/shared/api/drafts";
import { useAuth } from "@/features/auth/store/useAuth";
import { useToast } from "@/shared/ui/toast";

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

function duplicateRiskClass(risk?: "low" | "medium" | "high") {
  switch (risk) {
    case "high":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]";
    default:
      return "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]";
  }
}

function recommendedActionLabel(
  action?:
    | "create_draft"
    | "link_existing"
    | "merge_into_existing"
    | "reopen_existing",
) {
  switch (action) {
    case "merge_into_existing":
      return "Merge Into Existing";
    case "reopen_existing":
      return "Reopen Existing";
    case "link_existing":
      return "Link Existing";
    default:
      return "Create New Draft";
  }
}

export default function DraftsPage() {
  const { token, orgId, ready } = useAuth();
  const { pushToast } = useToast();
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
      pushToast({
        title: "Draft approved",
        description: `Draft #${id} was converted into a ticket.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve draft.";
      setError(message);
      pushToast({
        title: "Approval failed",
        description: message,
        tone: "error",
      });
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
      pushToast({
        title: "Draft rejected",
        description: `Draft #${id} was removed from the queue.`,
        tone: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject draft.";
      setError(message);
      pushToast({
        title: "Reject failed",
        description: message,
        tone: "error",
      });
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

      <section className="grid gap-4">
        {isLoading ? (
          <div className="glass-panel px-5 py-5 text-sm text-[var(--mm-mist)]">Loading drafts...</div>
        ) : null}
        {error ? <div className="glass-panel px-5 py-5 text-sm text-red-200">{error}</div> : null}
        {!isLoading && !error && drafts.length === 0 ? (
          <div className="glass-panel px-5 py-5 text-sm text-[var(--mm-mist)]">No drafts waiting for review.</div>
        ) : null}
        {drafts.map((draft) => {
          const draftId = String(draft.id);
          const primaryRecommendation =
            draft.decisionSnapshot?.recommendations?.find(
              (recommendation) =>
                recommendation.duplicateRisk === "high" &&
                recommendation.recommendedAction !== "create_draft",
            ) ?? draft.decisionSnapshot?.recommendations?.[0];

          return (
            <article
              key={draftId}
              className="glass-panel border border-[var(--mm-border)] bg-[rgba(8,11,18,0.66)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--mm-bone)]">#{draftId}</span>
                    <StatusBadge status={draft.status} />
                    {draft.priority ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${draftPriorityClass(draft.priority)}`}
                      >
                        {draft.priority}
                      </span>
                    ) : null}
                    {primaryRecommendation ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${duplicateRiskClass(primaryRecommendation.duplicateRisk)}`}
                      >
                        {recommendedActionLabel(primaryRecommendation.recommendedAction)}
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-[var(--mm-bone)]">{draft.title}</h4>
                  <p className="mt-2 text-sm text-[var(--mm-mist)]">
                    {primaryRecommendation?.recommendedActionReasoning?.[0] ??
                      (draft.source ? `Source: ${draft.source}` : "Draft review item")}
                  </p>
                  {primaryRecommendation?.recommendedTargetTicket ? (
                    <p className="mt-2 text-xs text-[var(--mm-mist)]">
                      Closest related ticket: #{primaryRecommendation.recommendedTargetTicket.id} ·{" "}
                      {primaryRecommendation.recommendedTargetTicket.title}
                    </p>
                  ) : null}
                </div>

                <div className="min-w-[220px] rounded-2xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-4">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                    Review status
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--mm-bone)]">
                    {draft.confidence ? `${(draft.confidence * 100).toFixed(0)}%` : "-"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--mm-mist)]">
                    {draft.decisionSnapshot ? "Decision snapshot attached" : "No decision snapshot"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  label="Review Draft"
                  variant="dark"
                  href={`/admin/drafts/${draftId}`}
                  className="px-3 py-2 text-xs"
                />
                <Button
                  label={actionId === draftId ? "Approving..." : "Approve"}
                  variant="ghost"
                  type="button"
                  disabled={actionId === draftId}
                  onClick={() => onApprove(draftId)}
                  className="px-3 py-2 text-xs"
                />
                <Button
                  label={actionId === draftId ? "Working..." : "Reject"}
                  variant="dark"
                  type="button"
                  disabled={actionId === draftId}
                  onClick={() => onReject(draftId)}
                  className="px-3 py-2 text-xs"
                />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
