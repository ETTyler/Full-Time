function Line({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-card-2 ${className}`} />;
}

/** Instant skeleton for the home page / dashboard. */
export default function LoadingHome() {
  return (
    <div className="space-y-10" aria-busy aria-label="Loading">
      <section>
        <div className="mb-3 flex items-center gap-3">
          <Line className="h-3 w-24" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="card flex items-center justify-between p-4"
            >
              <Line className="h-4 w-36" />
              <Line className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-3">
          <Line className="h-3 w-28" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="max-w-md space-y-3">
          <Line className="h-10 w-full" />
          <Line className="h-10 w-full" />
          <Line className="h-9 w-32" />
        </div>
      </section>
    </div>
  );
}
