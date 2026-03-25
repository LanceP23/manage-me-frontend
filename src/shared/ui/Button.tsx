import type { MouseEventHandler } from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mm-charcoal)] disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "bg-[linear-gradient(90deg,var(--mm-teal),#7ce6c7)] text-[var(--primary-foreground)] shadow-[0_8px_20px_rgba(89,219,181,0.25)] hover:brightness-105 focus-visible:ring-[var(--mm-teal)]",
  ghost:
    "border-[var(--mm-border)] bg-[rgba(255,255,255,0.02)] text-[var(--mm-bone)] hover:border-[var(--mm-border-strong)] hover:bg-[rgba(255,255,255,0.05)]",
  dark:
    "border-[var(--mm-border)] bg-[rgba(16,23,38,0.9)] text-[var(--mm-bone)] hover:bg-[rgba(26,39,64,0.95)]",
} as const;

type ButtonProps = {
  label: string;
  href?: string;
  variant?: keyof typeof variants;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export default function Button({
  label,
  href,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  className = "",
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
