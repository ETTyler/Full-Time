function Line({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-card-2 ${className}`} />;
}

/** Instant skeleton while the league page loads — mirrors its layout. */
export default function LoadingLeague() {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading league">
      {/* header: league name + member line */}
      <div className="space-y-2">
        <Line className="h-7 w-48" />
        <Line className="h-4 w-32" />
      </div>

      {/* standings */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <Line className="h-3 w-20" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="card space-y-0 px-2 py-1 sm:px-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-line px-1 py-3.5 last:border-b-0 sm:px-2"
            >
              <Line className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Line className="h-4 w-28" />
                <Line className="h-3 w-20" />
              </div>
              <Line className="h-5 w-10" />
            </div>
          ))}
        </div>
      </section>

      {/* team stickers */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <Line className="h-3 w-20" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card space-y-2 p-3">
              <Line className="h-5 w-6" />
              <Line className="h-4 w-24" />
              <Line className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
