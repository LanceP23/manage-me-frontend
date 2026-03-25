"use client";

import { useEffect, useState } from "react";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { exportAiLogs, getAiLogs } from "@/shared/api/aiLogs";
import { useAuth } from "@/features/auth/store/useAuth";

type LogRow = {
  id: string;
  promptVersion?: string;
  provider?: string;
  createdAt?: string;
};

export default function AiLogsPage() {
  const { token, orgId, ready } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    getAiLogs(token, orgId)
      .then((response) => {
        const data = response.data ?? [];
        setLogs(data);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load AI logs.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}

      <Card id="ai-export" eyebrow="Audit" title="AI evaluation logs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>Logs are organization-scoped. Export snapshots for incident and compliance reviews.</p>
          <Button
            label={isExporting ? "Exporting..." : "Export CSV"}
            type="button"
            variant="ghost"
            disabled={isExporting}
            onClick={async () => {
              if (!token || !orgId) {
                setError("Missing organization context for export.");
                return;
              }
              setIsExporting(true);
              setError(null);
              try {
                const blob = await exportAiLogs(token, orgId);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `ai-logs-${new Date().toISOString()}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Failed to export AI logs.";
                setError(message);
              } finally {
                setIsExporting(false);
              }
            }}
          />
        </div>
      </Card>

      <Table columns={4} headers={["Log", "Prompt Version", "Provider", "Created"]}>
        {isLoading ? <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading AI logs...</div> : null}
        {error ? <div className="px-5 py-5 text-sm text-red-200">{error}</div> : null}
        {!isLoading && !error && logs.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No AI logs available for this organization.</div>
        ) : null}
        {logs.map((log) => (
          <TableRow key={log.id} columns={4}>
            <TableCell label="Log" className="text-[var(--mm-bone)]">
              {log.id}
            </TableCell>
            <TableCell label="Prompt Version" className="text-[var(--mm-mist)]">
              {log.promptVersion ?? "—"}
            </TableCell>
            <TableCell label="Provider" className="text-[var(--mm-teal)]">
              {log.provider ?? "—"}
            </TableCell>
            <TableCell label="Created" className="text-[var(--mm-mist)]">
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
