"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import Textarea from "@/shared/ui/Textarea";
import Button from "@/shared/ui/Button";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { autoExecuteAgent } from "@/shared/api/agent";
import { getProducts } from "@/shared/api/products";
import { useAuth } from "@/features/auth/store/useAuth";

type AgentActionResult = {
  executed?: boolean;
  action?: string;
  confidence?: number;
  error?: string | null;
};

type AgentDecision = {
  execute?: boolean;
  confidence?: number;
  rationale?: string;
};

type AgentResponse = {
  dryRun?: boolean;
  decision?: AgentDecision;
  results?: AgentActionResult[];
  message?: string;
};

type RunMode = "create_ticket" | "update_ticket_status";

const modeOptions = [
  { value: "create_ticket", label: "Create Ticket" },
  { value: "update_ticket_status", label: "Update Ticket Status" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

type BuiltRequest = {
  context: string;
  payload: Record<string, unknown>;
  allowedActions: string[];
};

function buildRequest(params: {
  mode: RunMode;
  selectedProductId: number | null;
  title: string;
  description: string;
  priority: string;
  ticketId: string;
  targetStatus: string;
  reason: string;
  operatorNote: string;
}): BuiltRequest {
  const {
    mode,
    selectedProductId,
    title,
    description,
    priority,
    ticketId,
    targetStatus,
    reason,
    operatorNote,
  } = params;

  if (mode === "create_ticket") {
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "todo",
    };
    if (selectedProductId) {
      payload.productId = selectedProductId;
    }
    const context = [
      "Create a support ticket from admin operations console.",
      `Title: ${title.trim()}`,
      `Priority: ${priority}`,
      operatorNote.trim() ? `Operator note: ${operatorNote.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      context,
      payload,
      allowedActions: ["create_ticket"],
    };
  }

  const payload: Record<string, unknown> = {
    ticketId: ticketId.trim(),
    status: targetStatus,
  };
  if (selectedProductId) {
    payload.productId = selectedProductId;
  }
  if (reason.trim()) {
    payload.reason = reason.trim();
  }
  const context = [
    "Update an existing ticket status from admin operations console.",
    `Ticket ID: ${ticketId.trim()}`,
    `Target status: ${targetStatus}`,
    operatorNote.trim() ? `Operator note: ${operatorNote.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    context,
    payload,
    allowedActions: ["update_ticket_status"],
  };
}

export default function AgentPage() {
  const { token, orgId } = useAuth();
  const [products, setProducts] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [mode, setMode] = useState<RunMode>("create_ticket");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("high");
  const [ticketId, setTicketId] = useState("");
  const [targetStatus, setTargetStatus] = useState("in_progress");
  const [reason, setReason] = useState("");
  const [operatorNote, setOperatorNote] = useState("");

  const [dryRun, setDryRun] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.75);
  const [maxActions, setMaxActions] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);

  const preview = useMemo(
    () =>
      buildRequest({
        mode,
        selectedProductId,
        title,
        description,
        priority,
        ticketId,
        targetStatus,
        reason,
        operatorNote,
      }),
    [
      mode,
      selectedProductId,
      title,
      description,
      priority,
      ticketId,
      targetStatus,
      reason,
      operatorNote,
    ]
  );

  useEffect(() => {
    if (!token || !orgId) return;
    getProducts(token, orgId)
      .then((result) => {
        const data = result.data ?? [];
        setProducts(data.map((item) => ({ id: item.id, name: item.name })));
        if (!selectedProductId && data.length) {
          setSelectedProductId(data[0].id);
        }
      })
      .catch(() => {
        setProducts([]);
      });
  }, [token, orgId, selectedProductId]);

  const onRun = async () => {
    if (!token || !orgId) {
      setError("Missing organization context. Please log in again.");
      return;
    }

    if (mode === "create_ticket") {
      if (!title.trim() || !description.trim()) {
        setError("Title and description are required for ticket creation.");
        return;
      }
    } else if (!ticketId.trim()) {
      setError("Ticket ID is required to update ticket status.");
      return;
    }

    setError(null);
    setIsRunning(true);
    setResponse(null);

    try {
      const result = await autoExecuteAgent(token, orgId, {
        context: preview.context,
        payload: preview.payload,
        dryRun,
        minConfidence,
        maxActions,
        allowedActions: preview.allowedActions,
        source: "admin-console",
      });
      setResponse(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Agent execution failed.";
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Agent Operations</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Run guided automations with bounded scope</h3>
        <p className="mt-1 text-sm text-[var(--mm-mist)]">
          Select a workflow, fill structured fields, and execute with guardrails. Raw JSON is intentionally hidden from operators.
        </p>
      </section>

      <div className="mm-grid cols-2">
        <Card eyebrow="Workflow" title="Action setup">
          <div className="flex flex-col gap-3">
            <Select
              label="Automation type"
              value={mode}
              onChange={(event) => setMode(event.target.value as RunMode)}
              options={modeOptions}
            />

            <Select
              label="Product"
              value={selectedProductId ?? ""}
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value ? Number(event.target.value) : null
                )
              }
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>

            {mode === "create_ticket" ? (
              <>
                <Input
                  label="Ticket title"
                  placeholder="Login bug affecting iOS users"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="What happened, who is impacted, and when it started..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <Select
                  label="Priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  options={priorityOptions}
                />
              </>
            ) : (
              <>
                <Input
                  label="Ticket ID"
                  placeholder="uuid-ticket-id"
                  value={ticketId}
                  onChange={(event) => setTicketId(event.target.value)}
                />
                <Select
                  label="Target status"
                  value={targetStatus}
                  onChange={(event) => setTargetStatus(event.target.value)}
                  options={statusOptions}
                />
                <Input
                  label="Reason (optional)"
                  placeholder="Customer replied with new blocking detail"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </>
            )}

            <Textarea
              label="Operator note (optional)"
              placeholder="Any extra context for the agent decision..."
              value={operatorNote}
              onChange={(event) => setOperatorNote(event.target.value)}
            />
          </div>
        </Card>

        <Card id="agent-run" eyebrow="Guardrails" title="Execution policy">
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
              <span>Dry run</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--mm-teal)]"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
            </label>
            <Input
              label="Minimum confidence"
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={minConfidence}
              onChange={(event) => setMinConfidence(Number(event.target.value))}
            />
            <Input
              label="Maximum actions"
              type="number"
              min={1}
              max={5}
              value={maxActions}
              onChange={(event) => setMaxActions(Number(event.target.value))}
            />
            <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-3 text-xs text-[var(--mm-mist)]">
              <p className="font-medium text-[var(--mm-bone)]">Request preview</p>
              <p className="mt-1">Allowed action: {preview.allowedActions[0]}</p>
              <p className="mt-1">Context: {preview.context}</p>
            </div>
            <div className="pt-1">
              <Button
                label={isRunning ? "Running..." : dryRun ? "Run Dry-Run" : "Execute Action"}
                type="button"
                disabled={isRunning}
                onClick={onRun}
              />
            </div>
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            ) : null}
            {response?.message ? (
              <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-xs text-[var(--mm-mist)]">
                {response.message}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Table columns={3} headers={["Decision", "Action", "Outcome"]}>
        {response?.decision ? (
          <TableRow columns={3}>
            <TableCell label="Decision" className="text-[var(--mm-bone)]">
              Execute: {String(response.decision.execute ?? false)}
            </TableCell>
            <TableCell label="Action" className="text-[var(--mm-mist)]">
              {response.decision.rationale ?? "No rationale."}
            </TableCell>
            <TableCell label="Outcome" className="text-[var(--mm-teal)]">
              {((response.decision.confidence ?? 0) * 100).toFixed(0)}%
            </TableCell>
          </TableRow>
        ) : (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">
            Run a guided action to see decision and execution outcome.
          </div>
        )}
        {(response?.results ?? []).map((result, index) => (
          <TableRow key={`${result.action ?? "action"}-${index}`} columns={3}>
            <TableCell label="Decision" className="text-[var(--mm-bone)]">
              {result.executed ? "Executed" : "Skipped"}
            </TableCell>
            <TableCell label="Action" className="text-[var(--mm-mist)]">
              {result.action ?? "—"}
            </TableCell>
            <TableCell label="Outcome" className="text-[var(--mm-teal)]">
              {result.error ? `Error: ${result.error}` : "OK"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
