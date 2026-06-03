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
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="w-full rounded-lg border-[2.5px] border-ink bg-white px-3 py-2.5 text-sm font-medium text-ink placeholder:text-ink/35 focus:outline-none focus:ring-[3px] focus:ring-pop-yellow"
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
