"use client";

import { useEffect, useState } from "react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import StatusBadge from "@/shared/ui/StatusBadge";
import { autoExecuteAgent } from "@/shared/api/agent";
import { getTicketById, updateTicket } from "@/shared/api/tickets";
import { useAuth } from "@/features/auth/store/useAuth";

type TicketDetail = {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: string | null;
};

type TicketDetailClientProps = {
  ticketId: string;
};

export default function TicketDetailClient({ ticketId }: TicketDetailClientProps) {
  const { token, orgId, ready } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>("todo");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token || !orgId || !ticketId) return;
    setIsLoading(true);
    setError(null);

    getTicketById(token, ticketId, orgId)
      .then((response) => {
        setTicket({
          id: response.id,
          title: response.title,
          status: response.status,
          description: response.description ?? null,
          assigneeId: response.assigneeId ?? null,
          priority: response.priority ?? null,
        });
        setStatus(response.status);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load ticket.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId, ticketId]);

  if (!orgId) {
    return (
      <div className="mm-panel px-5 py-4 text-sm text-red-200">
        Missing organization context. Please log in again or select an org.
      </div>
    );
  }

  if (isLoading) {
    return <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">Loading ticket...</div>;
  }

  if (error) {
    return <div className="mm-panel px-5 py-4 text-sm text-red-200">{error}</div>;
  }

  if (!ticket) {
    return <div className="mm-panel px-5 py-4 text-sm text-[var(--mm-mist)]">Ticket not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Ticket Mission</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">
          {ticket.id} · {ticket.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">Priority: {ticket.priority ?? "Normal"}</p>
      </section>

      <div className="mm-grid cols-2">
        <Card eyebrow="Context" title="Summary">
          <p>{ticket.description ?? "No description provided."}</p>
          <div className="mm-divider" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Owner</span>
              <span className="text-[var(--mm-bone)]">{ticket.assigneeId ?? "Unassigned"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SLA</span>
              <span className="text-[var(--mm-bone)]">Escalation monitoring active</span>
            </div>
          </div>
        </Card>

        <Card eyebrow="Actions" title="Update workflow">
          <div className="flex flex-col gap-3">
            <StatusBadge status={ticket.status} />

            <label className="mm-field">
              <span className="mm-field-label">Status</span>
              <select
                className="mm-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isUpdating}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                label={isUpdating ? "Updating..." : "Apply Status"}
                type="button"
                variant="ghost"
                disabled={isUpdating || status === ticket.status}
                onClick={async () => {
                  if (!token) return;
                  setIsUpdating(true);
                  setError(null);
                  try {
                    const updated = await updateTicket(token, ticket.id, { status }, orgId);
                    setTicket((prev) => (prev ? { ...prev, status: updated.status } : prev));
                    setStatus(updated.status);
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "Failed to update ticket status.";
                    setError(message);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
              />
              <Button
                label={isAskingAi ? "Running AI..." : "Get AI Recommendation"}
                type="button"
                variant="dark"
                disabled={isAskingAi}
                onClick={async () => {
                  if (!token || !orgId) return;
                  setIsAskingAi(true);
                  setError(null);
                  setAiMessage(null);
                  try {
                    const result = await autoExecuteAgent(token, orgId, {
                      context:
                        "Review this ticket and suggest the safest status transition.",
                      payload: {
                        ticketId: ticket.id,
                        title: ticket.title,
                        description: ticket.description,
                        status: ticket.status,
                        suggestedStatus: "in_progress",
                        priority: ticket.priority,
                      },
                      allowedActions: ["update_ticket_status"],
                      dryRun: true,
                      source: "ticket_detail_ui",
                    });

                    const firstResult = result.results?.[0];
                    if (firstResult?.error) {
                      setAiMessage(`Recommendation failed: ${firstResult.error}`);
                      return;
                    }
                    if (result.decision?.rationale) {
                      const confidence = result.decision.confidence
                        ? ` (${Math.round(result.decision.confidence * 100)}% confidence)`
                        : "";
                      setAiMessage(`AI rationale${confidence}: ${result.decision.rationale}`);
                      return;
                    }
                    setAiMessage(
                      firstResult
                        ? `AI suggested action: ${firstResult.action ?? "update_ticket_status"}.`
                        : "No AI recommendation was returned."
                    );
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Agent request failed.";
                    setError(message);
                  } finally {
                    setIsAskingAi(false);
                  }
                }}
              />
            </div>

            {aiMessage ? (
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-xs text-[var(--mm-mist)]">
                {aiMessage}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
