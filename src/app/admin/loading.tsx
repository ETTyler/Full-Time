function Line({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-card-2 ${className}`} />;
}

/** Instant skeleton for the admin panel. */
export default function LoadingAdmin() {
  return (
    <div aria-busy aria-label="Loading admin">
      <Line className="h-3 w-12" />
      <Line className="mt-2 h-7 w-56" />
      <div className="mt-5 flex gap-1 border-b border-line pb-2">
        <Line className="h-8 w-20" />
        <Line className="h-8 w-20" />
      </div>
      <div className="mt-5 space-y-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Line className="h-4 w-52" />
            <Line className="h-7 w-40" />
            <Line className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
