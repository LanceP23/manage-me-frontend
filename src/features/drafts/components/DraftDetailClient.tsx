"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import StatusBadge from "@/shared/ui/StatusBadge";
import {
  approveDraft,
  getDraftAudit,
  getDraftById,
  mergeDraftIntoExisting,
  rejectDraft,
  type Draft,
  type DraftAuditEntry,
} from "@/shared/api/drafts";
import { useAuth } from "@/features/auth/store/useAuth";
import { useToast } from "@/shared/ui/toast";

type DraftDetailClientProps = {
  draftId: string;
};

function priorityClass(priority?: string | null) {
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

function effortClass(effort?: string) {
  switch (effort) {
    case "large":
      return "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]";
    case "medium":
      return "border-[rgba(110,185,255,0.52)] text-[#b7d8ff] bg-[rgba(110,185,255,0.16)]";
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
    case "create_draft":
      return "Create New Draft";
    default:
      return "No action recommendation";
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

function firstReason(reasons?: string[]) {
  return reasons?.[0] ?? "No supporting explanation was stored for this recommendation.";
}

function formatActor(entry: DraftAuditEntry) {
  if (entry.actor) {
    const name =
      `${entry.actor.firstName ?? ""} ${entry.actor.lastName ?? ""}`.trim() ||
      entry.actor.email ||
      entry.actor.id;
    return name;
  }
  return "System";
}

export default function DraftDetailClient({ draftId }: DraftDetailClientProps) {
  const router = useRouter();
  const { token, orgId, ready, user } = useAuth();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [audit, setAudit] = useState<DraftAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [mergedTicketId, setMergedTicketId] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !token || !orgId || !draftId) return;
    setIsLoading(true);
    setError(null);

    Promise.all([getDraftById(token, draftId, orgId), getDraftAudit(token, draftId, orgId)])
      .then(([draftResponse, auditResponse]) => {
        setDraft(draftResponse);
        setAudit(auditResponse);

        const mergeAudit = auditResponse.find(
          (entry) => entry.metadata?.resolution === "merged_existing",
        );
        const targetId = Number(mergeAudit?.metadata?.targetTicketId);
        setMergedTicketId(Number.isFinite(targetId) ? targetId : null);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load draft details.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [draftId, orgId, ready, token]);

  const recommendations = useMemo(() => {
    return Array.isArray(draft?.decisionSnapshot?.recommendations)
      ? draft?.decisionSnapshot?.recommendations
      : [];
  }, [draft]);

  const primaryRecommendation = useMemo(() => {
    return (
      recommendations.find(
        (recommendation) =>
          recommendation.duplicateRisk === "high" &&
          recommendation.recommendedAction !== "create_draft",
      ) ?? recommendations[0] ?? null
    );
  }, [recommendations]);

  if (!orgId) {
    return (
      <div className="mm-panel px-5 py-4 text-sm text-red-200">
        Missing organization context. Please log in again or select an org.
      </div>
    );
  }

  if (isLoading) {
    return <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">Loading draft...</div>;
  }

  if (error) {
    return <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div>;
  }

  if (!draft) {
    return <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">Draft not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Draft Review</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[var(--mm-bone)]">
              Draft #{draft.id} · {draft.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--mm-mist)]">
              Review the generated draft, the decision support behind it, and resolve it into a new or existing ticket.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {draft.priority ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${priorityClass(draft.priority)}`}
              >
                {draft.priority}
              </span>
            ) : null}
            {draft.source ? (
              <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                {draft.source}
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--mm-border)] px-2.5 py-1 font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
              {draft.approvalStatus ?? "draft"}
            </span>
          </div>
        </div>
      </section>

      <section className="glass-panel border border-[var(--mm-border)] bg-[rgba(8,11,18,0.74)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">
              Recommended resolution
            </p>
            <h4 className="mt-2 text-2xl font-semibold text-[var(--mm-bone)]">
              {recommendedActionLabel(primaryRecommendation?.recommendedAction)}
              {primaryRecommendation?.recommendedTargetTicket?.id
                ? ` with #${primaryRecommendation.recommendedTargetTicket.id}`
                : ""}
            </h4>
            {primaryRecommendation?.recommendedTargetTicket ? (
              <p className="mt-2 text-sm text-[var(--mm-mist)]">
                {primaryRecommendation.recommendedTargetTicket.title}
                {primaryRecommendation.recommendedTargetTicket.status
                  ? ` • ${primaryRecommendation.recommendedTargetTicket.status}`
                  : ""}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-[var(--mm-mist)]">
              {firstReason(primaryRecommendation?.recommendedActionReasoning)}
            </p>
          </div>
          {primaryRecommendation ? (
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${duplicateRiskClass(primaryRecommendation.duplicateRisk)}`}
            >
              {primaryRecommendation.duplicateRisk} duplicate risk
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
              Priority
            </p>
            <div className="mt-2 flex items-center gap-2">
              {primaryRecommendation?.priority ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${priorityClass(primaryRecommendation.priority)}`}
                >
                  {primaryRecommendation.priority}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[var(--mm-mist)]">
              {firstReason(primaryRecommendation?.priorityReasoning)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
              Owner
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--mm-bone)]">
              {primaryRecommendation?.suggestedOwner?.name ?? "No confident owner suggestion"}
            </p>
            <p className="mt-2 text-sm text-[var(--mm-mist)]">
              {firstReason(primaryRecommendation?.ownerReasoning)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-mist)]">
              Effort
            </p>
            <div className="mt-2 flex items-center gap-2">
              {primaryRecommendation?.effortEstimate ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${effortClass(primaryRecommendation.effortEstimate)}`}
                >
                  {primaryRecommendation.effortEstimate}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[var(--mm-mist)]">
              {firstReason(primaryRecommendation?.effortReasoning)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {draft.approvalStatus === "draft" && primaryRecommendation?.recommendedTargetTicket?.id ? (
            <Button
              label={
                isWorking
                  ? "Merging..."
                  : `Merge Into #${primaryRecommendation.recommendedTargetTicket.id}`
              }
              variant="ghost"
              disabled={isWorking}
              onClick={async () => {
                if (!token || !orgId || !primaryRecommendation.recommendedTargetTicket?.id) {
                  return;
                }
                setIsWorking(true);
                setError(null);
                try {
                  const result = await mergeDraftIntoExisting(
                    token,
                    String(draft.id),
                    {
                      targetTicketId: Number(primaryRecommendation.recommendedTargetTicket.id),
                      mergedById: user?.id,
                    },
                    orgId,
                  );
                  setDraft(result.draft);
                  setMergedTicketId(result.mergedIntoTicket.id);
                  pushToast({
                    title: "Draft merged into existing ticket",
                    description: `Resolved into ticket #${result.mergedIntoTicket.id}.`,
                    tone: "success",
                  });
                  const auditResponse = await getDraftAudit(token, String(draft.id), orgId);
                  setAudit(auditResponse);
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Failed to merge draft into existing ticket.";
                  pushToast({
                    title: "Merge failed",
                    description: message,
                    tone: "error",
                  });
                } finally {
                  setIsWorking(false);
                }
              }}
            />
          ) : null}
          {draft.approvalStatus === "draft" ? (
            <>
              <Button
                label={isWorking ? "Working..." : "Approve As New Ticket"}
                variant="dark"
                disabled={isWorking}
                onClick={async () => {
                  if (!token || !orgId) return;
                  setIsWorking(true);
                  setError(null);
                  try {
                    await approveDraft(token, String(draft.id), orgId);
                    pushToast({
                      title: "Draft approved",
                      description: "The draft was converted into a ticket.",
                      tone: "success",
                    });
                    router.push("/admin/drafts");
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "Failed to approve draft.";
                    pushToast({
                      title: "Approval failed",
                      description: message,
                      tone: "error",
                    });
                    setIsWorking(false);
                  }
                }}
              />
              <Button
                label={isWorking ? "Working..." : "Reject Draft"}
                variant="dark"
                disabled={isWorking}
                onClick={async () => {
                  if (!token || !orgId) return;
                  setIsWorking(true);
                  setError(null);
                  try {
                    const result = await rejectDraft(token, String(draft.id), orgId);
                    setDraft(result);
                    pushToast({
                      title: "Draft rejected",
                      description: "The draft was removed from the pending queue.",
                      tone: "success",
                    });
                    const auditResponse = await getDraftAudit(token, String(draft.id), orgId);
                    setAudit(auditResponse);
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "Failed to reject draft.";
                    pushToast({
                      title: "Reject failed",
                      description: message,
                      tone: "error",
                    });
                  } finally {
                    setIsWorking(false);
                  }
                }}
              />
            </>
          ) : null}
          {primaryRecommendation?.recommendedTargetTicket?.id ? (
            <Button
              label={`Open Ticket #${primaryRecommendation.recommendedTargetTicket.id}`}
              variant="ghost"
              href={`/app/tickets/${primaryRecommendation.recommendedTargetTicket.id}`}
            />
          ) : null}
          {mergedTicketId ? (
            <Button
              label={`Open Merged Ticket #${mergedTicketId}`}
              variant="ghost"
              href={`/app/tickets/${mergedTicketId}`}
            />
          ) : null}
          <Button label="Back To Queue" variant="dark" href="/admin/drafts" />
        </div>
      </section>

      <div className="mm-grid cols-2">
        <Card eyebrow="Draft" title="Generated content">
          <p className="whitespace-pre-wrap text-[var(--mm-mist)]">
            {draft.description ?? "No description provided."}
          </p>
          <div className="mm-divider" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Owner</span>
              <span className="text-[var(--mm-bone)]">
                {draft.assignedTo
                  ? `${draft.assignedTo.firstName ?? ""} ${draft.assignedTo.lastName ?? ""}`.trim() ||
                    draft.assignedTo.email ||
                    draft.assignedTo.id
                  : "Unassigned"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Product</span>
              <span className="text-[var(--mm-bone)]">{draft.product?.name ?? "Not linked"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Confidence</span>
              <span className="text-[var(--mm-bone)]">
                {draft.confidence ? `${Math.round(draft.confidence * 100)}%` : "-"}
              </span>
            </div>
          </div>
        </Card>

        <Card eyebrow="Decision" title="Decision snapshot summary">
          {primaryRecommendation ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                  Why this path
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                  {(primaryRecommendation.recommendedActionReasoning ?? []).map((reason) => (
                    <p key={reason}>- {reason}</p>
                  ))}
                </div>
              </div>
              <details className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--mm-bone)]">
                  See matched history
                </summary>
                <div className="mt-3 flex flex-col gap-2">
                  {(primaryRecommendation.matchedPastTickets ?? []).length > 0 ? (
                    (primaryRecommendation.matchedPastTickets ?? []).map((ticket) => (
                      <div
                        key={`${draft.id}-${ticket.id ?? ticket.title}-${ticket.similarityReason}`}
                        className="rounded-lg border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-[var(--mm-bone)]">
                          {ticket.id ? `#${ticket.id} - ` : ""}
                          {ticket.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--mm-mist)]">
                          {ticket.similarityReason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--mm-mist)]">
                      No matched history was stored for this draft.
                    </p>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <p className="text-[var(--mm-mist)]">
              No decision snapshot is available for this draft.
            </p>
          )}
        </Card>
      </div>

      <Card eyebrow="Decision Support" title="Why the system recommended this path">
        {recommendations.length === 0 ? (
          <p className="text-[var(--mm-mist)]">No decision snapshot was stored for this draft.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendations.map((recommendation, index) => (
              <div
                key={`${draft.id}-${recommendation.rawReport}-${index}`}
                className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--mm-bone)]">
                      {recommendation.rawReport}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mm-mist)]">
                      Confidence {(recommendation.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${priorityClass(recommendation.priority)}`}
                    >
                      {recommendation.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.08em] ${effortClass(recommendation.effortEstimate)}`}
                    >
                      {recommendation.effortEstimate}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                      Priority reasoning
                    </p>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                      {(recommendation.priorityReasoning ?? []).map((reason) => (
                        <p key={reason}>- {reason}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                      Suggested owner
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--mm-bone)]">
                      {recommendation.suggestedOwner?.name ?? "No confident owner suggestion"}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                      {(recommendation.ownerReasoning ?? []).map((reason) => (
                        <p key={reason}>- {reason}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]">
                      History and effort
                    </p>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-[var(--mm-mist)]">
                      {(recommendation.effortReasoning ?? []).map((reason) => (
                        <p key={reason}>- {reason}</p>
                      ))}
                    </div>
                    {(recommendation.matchedPastTickets ?? []).length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {(recommendation.matchedPastTickets ?? []).map((ticket) => (
                          <div
                            key={`${draft.id}-${ticket.id ?? ticket.title}-${ticket.similarityReason}`}
                            className="rounded-lg border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2"
                          >
                            <p className="text-sm font-semibold text-[var(--mm-bone)]">
                              {ticket.id ? `#${ticket.id} - ` : ""}
                              {ticket.title}
                            </p>
                            <p className="mt-1 text-xs text-[var(--mm-mist)]">
                              {ticket.similarityReason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card eyebrow="Audit" title="Resolution history">
        {audit.length === 0 ? (
          <p className="text-[var(--mm-mist)]">No audit entries recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {audit.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--mm-bone)]">
                      {entry.action.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mm-mist)]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={entry.action} />
                </div>
                <p className="mt-2 text-sm text-[var(--mm-mist)]">
                  Actor: {formatActor(entry)}
                </p>
                {entry.approvedTicket ? (
                  <p className="mt-2 text-sm text-[var(--mm-mist)]">
                    Target ticket: #{entry.approvedTicket.id} · {entry.approvedTicket.title}
                  </p>
                ) : null}
                {entry.metadata ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-[var(--mm-border)] bg-[rgba(8,11,18,0.42)] px-3 py-2 text-xs text-[var(--mm-mist)]">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
