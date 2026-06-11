/** Tiny inline spinner — inherits text colour via border-current. */
export function Spinner({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
