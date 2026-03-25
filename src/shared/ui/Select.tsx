import type { SelectHTMLAttributes } from "react";

type Option = {
  value: string | number;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  options?: Option[];
};

export default function Select({
  label,
  hint,
  options = [],
  className = "",
  children,
  ...props
}: SelectProps) {
  const content = options.length
    ? options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))
    : children;

  const select = (
    <select className={`mm-input ${className}`.trim()} {...props}>
      {content}
    </select>
  );

  if (!label) {
    return select;
  }

  return (
    <label className="mm-field">
      <span className="mm-field-label">{label}</span>
      {select}
      {hint ? <span className="mm-field-hint">{hint}</span> : null}
    </label>
  );
}
