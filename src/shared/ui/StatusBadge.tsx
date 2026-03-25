const statusMap: Record<string, { label: string; className: string }> = {
  todo: {
    label: "Todo",
    className:
      "border-[var(--mm-border)] text-[var(--mm-mist)] bg-[rgba(255,255,255,0.03)]",
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-[rgba(110,185,255,0.52)] text-[#b7d8ff] bg-[rgba(110,185,255,0.16)]",
  },
  done: {
    label: "Done",
    className:
      "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-[rgba(244,111,126,0.45)] text-[#ffb8c1] bg-[rgba(244,111,126,0.14)]",
  },
  blocked: {
    label: "Blocked",
    className:
      "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]",
  },
  active: {
    label: "Active",
    className:
      "border-[rgba(89,219,181,0.45)] text-[#9ff4de] bg-[rgba(89,219,181,0.14)]",
  },
  degraded: {
    label: "Degraded",
    className:
      "border-[rgba(239,157,115,0.45)] text-[#ffd0b2] bg-[rgba(239,157,115,0.14)]",
  },
  unknown: {
    label: "Unknown",
    className:
      "border-[var(--mm-border)] text-[var(--mm-mist)] bg-[rgba(255,255,255,0.03)]",
  },
};

type StatusBadgeProps = {
  status?: string | null;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = status ?? "todo";
  const config = statusMap[key] ?? {
    label: status ?? "Unknown",
    className:
      "border-[var(--mm-border)] text-[var(--mm-mist)] bg-[rgba(255,255,255,0.03)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
