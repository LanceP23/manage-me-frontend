import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export default function Input({ label, hint, className = "", ...props }: InputProps) {
  const input = <input className={`mm-input ${className}`.trim()} {...props} />;

  if (!label) {
    return input;
  }

  return (
    <label className="mm-field">
      <span className="mm-field-label">{label}</span>
      {input}
      {hint ? <span className="mm-field-hint">{hint}</span> : null}
    </label>
  );
}
