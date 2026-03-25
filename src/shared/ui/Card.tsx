import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  id?: string;
  className?: string;
};

export default function Card({
  title,
  eyebrow,
  children,
  id,
  className = "",
}: CardProps) {
  return (
    <div id={id} className={`glass-panel ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-teal)]">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h3 className="mt-2 text-lg font-semibold text-[var(--mm-bone)]">{title}</h3>
      ) : null}
      <div className="mt-3 text-sm leading-relaxed text-[var(--mm-mist)]">{children}</div>
    </div>
  );
}
