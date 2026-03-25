import type { ReactNode } from "react";

type TableProps = {
  columns: number;
  headers: string[];
  children: ReactNode;
};

export function Table({ columns, headers, children }: TableProps) {
  return (
    <div className="glass-panel mm-table p-0">
      <div
        className="mm-table-header grid gap-4 border-b border-[var(--mm-border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-mist)]"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      <div className="divide-y divide-[var(--mm-border)]">{children}</div>
    </div>
  );
}

type TableRowProps = {
  columns: number;
  children: ReactNode;
  className?: string;
};

export function TableRow({ columns, children, className = "" }: TableRowProps) {
  return (
    <div
      className={`mm-table-row grid gap-4 px-5 py-3 text-sm ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

type TableCellProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function TableCell({ label, children, className = "" }: TableCellProps) {
  return (
    <span className={`mm-table-cell ${className}`.trim()} data-label={label}>
      {children}
    </span>
  );
}
