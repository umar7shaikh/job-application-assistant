export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  autoComplete,
  hint,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  hint?: string;
  errors?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      {hint && !errors?.length ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
      {errors?.length ? (
        <span className="mt-1 block text-xs text-danger">{errors[0]}</span>
      ) : null}
    </label>
  );
}
