/**
 * Chalk-style section header — small caps, wide tracking, hairline rule.
 * The same visual language as the day dividers in the fixtures list.
 */
export function SectionHeader({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </h2>
      <span className="h-px flex-1 bg-line" />
      {hint && <span className="shrink-0 text-xs text-muted">{hint}</span>}
    </div>
  );
}
