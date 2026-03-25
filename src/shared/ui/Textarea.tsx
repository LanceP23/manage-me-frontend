import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export default function Textarea({
  label,
  hint,
  className = "",
  ...props
}: TextareaProps) {
  const textarea = (
    <textarea className={`mm-input mm-textarea ${className}`.trim()} {...props} />
  );

  if (!label) {
    return textarea;
  }

  return (
    <label className="mm-field">
      <span className="mm-field-label">{label}</span>
      {textarea}
      {hint ? <span className="mm-field-hint">{hint}</span> : null}
    </label>
  );
}
