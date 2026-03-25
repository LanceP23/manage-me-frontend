"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import StatusBadge from "@/shared/ui/StatusBadge";
import { Table, TableCell, TableRow } from "@/shared/ui/Table";
import { getTickets } from "@/shared/api/tickets";
import { useAuth } from "@/features/auth/store/useAuth";

type TicketRow = {
  id: string;
  title: string;
  status: string;
  owner?: string | null;
};

const statusFilters = [
  { key: "all", label: "All" },
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["key"];

export default function TicketsPage() {
  const { token, orgId, ready } = useAuth();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!ready || !token || !orgId) return;
    setIsLoading(true);
    setError(null);

    getTickets(token, orgId)
      .then((response) => {
        const data = response.data ?? [];
        setRows(
          data.map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            owner: ticket.assigneeId ?? null,
          }))
        );
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Failed to load tickets.";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ready, token, orgId]);

  const ticketMetrics = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter((row) => row.status === "in_progress").length;
    const blocked = rows.filter((row) => row.status === "blocked").length;
    return { total, inProgress, blocked };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = activeFilter === "all" || row.status === activeFilter;
      const matchesQuery =
        !normalizedQuery ||
        row.title.toLowerCase().includes(normalizedQuery) ||
        row.id.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [activeFilter, query, rows]);

  return (
    <div className="flex flex-col gap-6">
      {!orgId ? (
        <div className="mm-panel px-5 py-4 text-sm text-red-200">
          Missing organization context. Please log in again or select an org.
        </div>
      ) : null}

      <section className="glass-panel">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--mm-teal)]">Ticket Queue</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mm-bone)]">Worklist prioritized for operator action</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-xs text-[var(--mm-mist)]">Total</p>
            <p className="mt-1 text-xl font-semibold text-[var(--mm-bone)]">{ticketMetrics.total}</p>
          </div>
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-xs text-[var(--mm-mist)]">In progress</p>
            <p className="mt-1 text-xl font-semibold text-[var(--mm-bone)]">{ticketMetrics.inProgress}</p>
          </div>
          <div className="rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-xs text-[var(--mm-mist)]">Blocked</p>
            <p className="mt-1 text-xl font-semibold text-[var(--mm-bone)]">{ticketMetrics.blocked}</p>
          </div>
        </div>
      </section>

      <Card eyebrow="Filters" title="Status segments">
        <div className="flex flex-col gap-3">
          <Input
            label="Search tickets"
            placeholder="Filter by ticket ID or title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={
                  activeFilter === filter.key
                    ? "mm-pill"
                    : "rounded-full border border-[var(--mm-border)] px-3 py-1.5 text-[var(--mm-mist)] transition hover:border-[var(--mm-border-strong)] hover:text-[var(--mm-bone)]"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Table columns={4} headers={["Ticket", "Title", "Status", "Owner"]}>
        {isLoading ? <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">Loading tickets...</div> : null}
        {error ? <div className="px-5 py-5 text-sm text-red-200">{error}</div> : null}
        {!isLoading && !error && filteredRows.length === 0 ? (
          <div className="px-5 py-5 text-sm text-[var(--mm-mist)]">No tickets match this filter.</div>
        ) : null}
        {filteredRows.map((row) => (
          <Link key={row.id} href={`/app/tickets/${row.id}`} className="mm-table-link">
            <TableRow columns={4}>
              <TableCell label="Ticket">{row.id}</TableCell>
              <TableCell label="Title" className="text-[var(--mm-mist)]">
                {row.title}
              </TableCell>
              <TableCell label="Status">
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell label="Owner">{row.owner ?? "—"}</TableCell>
            </TableRow>
          </Link>
        ))}
      </Table>
    </div>
  );
}
